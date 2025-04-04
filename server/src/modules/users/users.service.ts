import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    
    return user ? new User(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    return user ? new User(user) : null;
  }

  async create(data: { email: string; name: string; password: string; role?: Role }): Promise<User> {
    const { email, name, password, role = Role.OWNER } = data;
    
    // Check if email already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate verification token
    const emailVerifyToken = this.generateToken();
    
    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role as any, // Safe cast as the enum values match
        emailVerifyToken,
      },
    });
    
    return new User(newUser);
  }

  async update(id: string, data: { name?: string; email?: string }): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // If email is changing, check if it already exists
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
    }
    
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    
    return new User(updatedUser);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await this.prisma.user.update({
      where: { id },
      data: { 
        passwordHash,
        lastPasswordChangeAt: new Date(),
      },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Theo dõi và cập nhật thông tin đăng nhập
   */
  async updateLastLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || null,
        lastUserAgent: userAgent || null,
      },
    });
  }

  /**
   * Tăng số lần đăng nhập thất bại
   */
  async incrementFailedLoginAttempts(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Tăng số lần đăng nhập thất bại
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });
    
    // Kiểm tra nếu vượt quá số lần thất bại cho phép (5 lần), khóa tài khoản tạm thời
    if (updatedUser.failedLoginAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Khóa 30 phút
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isLocked: true,
          lockedUntil: lockUntil,
        },
      });
    }
    
    return new User(updatedUser);
  }

  /**
   * Reset số lần đăng nhập thất bại
   */
  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });
  }

  /**
   * Mở khóa tài khoản bị khóa
   */
  async unlockAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
  }

  /**
   * Generate a random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    return new User(updatedUser);
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(email: string): Promise<{ user: User; token: string }> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetPasswordToken = this.generateToken();
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    return { 
      user: new User(updatedUser),
      token: resetPasswordToken 
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastPasswordChangeAt: new Date(),
      },
    });

    return new User(updatedUser);
  }

  /**
   * Regenerate email verification token
   */
  async regenerateEmailVerifyToken(userId: string): Promise<User> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const emailVerifyToken = this.generateToken();
    
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken,
      },
    });
    
    return new User(updatedUser);
  }
} 