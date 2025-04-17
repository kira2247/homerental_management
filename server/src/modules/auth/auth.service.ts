import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Kiểm tra nếu tài khoản bị khóa
    if (user.isLocked) {
      // Kiểm tra xem đã hết thời gian khóa chưa
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Account is locked. Please try again later.');
      } else {
        // Tự động mở khóa nếu đã hết thời gian
        await this.usersService.unlockAccount(user.id);
      }
    }
    
    const isPasswordValid = await this.usersService.validatePassword(user, password);
    
    if (!isPasswordValid) {
      // Tăng số lần đăng nhập thất bại
      await this.usersService.incrementFailedLoginAttempts(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Reset số lần đăng nhập thất bại nếu thành công
    if (user.failedLoginAttempts > 0) {
      await this.usersService.resetFailedLoginAttempts(user.id);
    }
    
    return user;
  }

  async login(user: User, ipAddress?: string, userAgent?: string) {
    const payload = { 
      sub: user.id,
      email: user.email, 
      name: user.name,
      role: user.role 
    };
    
    // Tạo access token (JWT ngắn hạn, 30 phút)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '30m'
    });
    
    
    // Tạo refresh token
    const refreshToken = uuidv4();
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // Hết hạn sau 7 ngày
    
    // Revoke all existing refresh tokens for security
    await this.revokeUserRefreshTokens(user.id);
    
    // Lưu refresh token mới
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpires,
        createdByIp: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
    
    // Cập nhật thông tin đăng nhập
    await this.usersService.updateLastLogin(user.id, ipAddress, userAgent);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 1800, // 30 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  // Phương thức hỗ trợ vô hiệu hóa tất cả refresh token của user
  private async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      }
    });
  }

  // Phương thức refresh token
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
    // Tìm refresh token hợp lệ
    const token = await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
    
    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    // Vô hiệu hóa token cũ (rotation)
    const newRefreshToken = uuidv4();
    const newRefreshTokenExpires = new Date();
    newRefreshTokenExpires.setDate(newRefreshTokenExpires.getDate() + 7);
    
    // Cập nhật token cũ, đánh dấu đã thay thế
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { 
        isRevoked: true,
        revokedAt: new Date(),
        replacedByToken: newRefreshToken
      },
    });
    
    // Tạo token mới
    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: token.userId,
        expiresAt: newRefreshTokenExpires,
        createdByIp: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
    
    // Tạo access token mới
    const user = new User(token.user);
    const payload = { 
      sub: user.id,
      email: user.email, 
      name: user.name,
      role: user.role 
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '30m'
    });
    
    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 1800, // 30 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  // Đăng xuất - vô hiệu hóa token
  async logout(refreshToken: string): Promise<boolean> {
    const token = await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        isRevoked: false,
      },
    });
    
    if (token) {
      await this.prisma.refreshToken.update({
        where: { id: token.id },
        data: { 
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
    }
    
    return true;
  }

  async register(userData: { name: string; email: string; password: string }, ipAddress?: string, userAgent?: string) {
    // Create new user
    const newUser = await this.usersService.create(userData);
    
    // Send verification email
    await this.sendVerificationEmail(newUser);
    
    // Login the newly created user
    return this.login(newUser, ipAddress, userAgent);
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(user: User): Promise<void> {
    if (!user.emailVerifyToken) {
      throw new BadRequestException('User has no verification token');
    }
    
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      user.emailVerifyToken
    );
  }

  /**
   * Verify user email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    await this.usersService.verifyEmail(token);
    return { success: true };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean }> {
    try {
      const { user, token } = await this.usersService.createPasswordResetToken(email);
      
      await this.mailService.sendPasswordResetEmail(
        user.email,
        user.name,
        token
      );
      
      return { success: true };
    } catch (error) {
      // Return success even if email not found for security reasons
      if (error instanceof NotFoundException) {
        return { success: true };
      }
      throw error;
    }
  }

  /**
   * Reset user password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    await this.usersService.resetPassword(token, newPassword);
    return { success: true };
  }

  /**
   * Resend verification email to user
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    
    // Generate new token if needed
    let verifyToken = user.emailVerifyToken;
    
    if (!verifyToken) {
      const updatedUser = await this.usersService.regenerateEmailVerifyToken(userId);
      verifyToken = updatedUser.emailVerifyToken;
    }
    
    if (!verifyToken) {
      throw new BadRequestException('Failed to generate verification token');
    }
    
    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      verifyToken
    );
  }
} 