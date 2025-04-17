import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '../users/user.entity';
import { Role } from '@prisma/client';

// Mock data
const mockUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed_password',
  passwordHash: 'hashed_password',
  role: Role.OWNER,
  isLocked: false,
  isActive: true,
  lockedUntil: null,
  failedLoginAttempts: 0,
  emailVerified: true,
  emailVerifyToken: 'verification-token',
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  toSafeObject: jest.fn().mockReturnValue({
    id: 'user-id-1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.OWNER,
  }),
};

const mockLoginResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 1800,
  user: {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: Role.OWNER,
    emailVerified: mockUser.emailVerified,
  },
};

// Mock Services
const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  validatePassword: jest.fn(),
  incrementFailedLoginAttempts: jest.fn(),
  resetFailedLoginAttempts: jest.fn(),
  unlockAccount: jest.fn(),
  updateLastLogin: jest.fn(),
  create: jest.fn(),
  verifyEmail: jest.fn(),
  createPasswordResetToken: jest.fn(),
  resetPassword: jest.fn(),
  regenerateEmailVerifyToken: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

const mockPrismaService = {
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

// Lưu trữ ngày giờ thực
const originalDate = global.Date;
const fixedDate = new Date('2023-01-01T00:00:00Z');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'correct_password');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(mockUser, 'correct_password');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.validatePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.validateUser(mockUser.email, 'wrong_password'))
        .rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.incrementFailedLoginAttempts).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1); // 1 hour from now
      
      const lockedUser = {
        ...mockUser,
        isLocked: true,
        lockedUntil: futureDate
      };
      mockUsersService.findByEmail.mockResolvedValue(lockedUser);

      await expect(service.validateUser(lockedUser.email, 'password'))
        .rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.validatePassword).not.toHaveBeenCalled();
    });
    
    it('should unlock account if lock period has expired', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago
      
      const lockedUser = {
        ...mockUser,
        isLocked: true,
        lockedUntil: pastDate
      };
      mockUsersService.findByEmail.mockResolvedValue(lockedUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.unlockAccount.mockResolvedValue(undefined);
      
      const result = await service.validateUser(lockedUser.email, 'password');
      
      expect(mockUsersService.unlockAccount).toHaveBeenCalledWith(lockedUser.id);
      expect(result).toEqual(lockedUser);
    });
    
    it('should reset failed login attempts after successful login', async () => {
      const userWithFailedAttempts = {
        ...mockUser,
        failedLoginAttempts: 2
      };
      mockUsersService.findByEmail.mockResolvedValue(userWithFailedAttempts);
      mockUsersService.validatePassword.mockResolvedValue(true);
      
      await service.validateUser(userWithFailedAttempts.email, 'password');
      
      expect(mockUsersService.resetFailedLoginAttempts).toHaveBeenCalledWith(userWithFailedAttempts.id);
    });
  });
  
  describe('login', () => {
    it('should generate tokens and return login response', async () => {
      const userObject = new User(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'refresh-token-id' });
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'jwt.expiresIn') return '30m';
        return null;
      });
      
      const result = await service.login(userObject, '127.0.0.1', 'Mozilla/5.0');
      
      expect(jwtService.sign).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled(); // Revoke existing tokens
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled(); // Create new token
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(
        mockUser.id, 
        '127.0.0.1', 
        'Mozilla/5.0'
      );
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('expires_in');
      expect(result).toHaveProperty('user');
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh tokens when valid refresh token is provided', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // 1 day in future
      
      const token = {
        id: 'refresh-token-id',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        isRevoked: false,
        expiresAt: futureDate,
        user: mockUser
      };
      
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(token);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'jwt.expiresIn') return '30m';
        return null;
      });
      
      const result = await service.refreshToken('valid-refresh-token', '127.0.0.1', 'Mozilla/5.0');
      
      expect(mockPrismaService.refreshToken.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalled(); // Revoke old token
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled(); // Create new token
      expect(jwtService.sign).toHaveBeenCalled(); // Generate new access token
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('expires_in');
      expect(result).toHaveProperty('user');
    });
    
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);
      
      await expect(service.refreshToken('invalid-token', '127.0.0.1', 'Mozilla/5.0'))
        .rejects.toThrow(UnauthorizedException);
        
      expect(mockPrismaService.refreshToken.update).not.toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.create).not.toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    it('should revoke refresh token when valid token is provided', async () => {
      const token = {
        id: 'refresh-token-id',
        token: 'valid-refresh-token',
        isRevoked: false
      };
      
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(token);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      
      const result = await service.logout('valid-refresh-token');
      
      expect(mockPrismaService.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid-refresh-token',
          isRevoked: false,
        },
      });
      
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return true even if token not found', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);
      
      const result = await service.logout('invalid-token');
      
      expect(result).toBe(true);
      expect(mockPrismaService.refreshToken.update).not.toHaveBeenCalled();
    });
  });
  
  describe('register', () => {
    it('should create user, send verification email, and login', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };
      
      const newUser = {
        ...mockUser,
        name: userData.name,
        email: userData.email,
        emailVerified: false
      };
      
      mockUsersService.create.mockResolvedValue(newUser);
      
      // Mock the sendVerificationEmail method
      jest.spyOn(service, 'sendVerificationEmail').mockResolvedValue(undefined);
      
      // Mock the login method
      jest.spyOn(service, 'login').mockResolvedValue(mockLoginResponse);
      
      const result = await service.register(userData, '127.0.0.1', 'Mozilla/5.0');
      
      expect(mockUsersService.create).toHaveBeenCalledWith(userData);
      expect(service.sendVerificationEmail).toHaveBeenCalledWith(newUser);
      expect(service.login).toHaveBeenCalledWith(newUser, '127.0.0.1', 'Mozilla/5.0');
      expect(result).toEqual(mockLoginResponse);
    });
  });
  
  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      await service.sendVerificationEmail(mockUser);
      
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        mockUser.emailVerifyToken
      );
    });
    
    it('should throw BadRequestException if user has no verification token', async () => {
      const userWithoutToken = { ...mockUser, emailVerifyToken: null };
      
      await expect(service.sendVerificationEmail(userWithoutToken))
        .rejects.toThrow(BadRequestException);
        
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
  
  describe('verifyEmail', () => {
    it('should verify email with token', async () => {
      mockUsersService.verifyEmail.mockResolvedValue(undefined);
      
      const result = await service.verifyEmail('valid-token');
      
      expect(mockUsersService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ success: true });
    });
  });
  
  describe('forgotPassword', () => {
    it('should create reset token and send password reset email', async () => {
      mockUsersService.createPasswordResetToken.mockResolvedValue({
        user: mockUser,
        token: 'reset-token'
      });
      
      const result = await service.forgotPassword(mockUser.email);
      
      expect(mockUsersService.createPasswordResetToken).toHaveBeenCalledWith(mockUser.email);
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        'reset-token'
      );
      expect(result).toEqual({ success: true });
    });
    
    it('should return success even if email not found for security', async () => {
      mockUsersService.createPasswordResetToken.mockRejectedValue(
        new NotFoundException('User not found')
      );
      
      const result = await service.forgotPassword('nonexistent@example.com');
      
      expect(result).toEqual({ success: true });
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
    
    it('should rethrow other errors', async () => {
      mockUsersService.createPasswordResetToken.mockRejectedValue(
        new Error('Database error')
      );
      
      await expect(service.forgotPassword(mockUser.email))
        .rejects.toThrow('Database error');
        
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password with token', async () => {
      mockUsersService.resetPassword.mockResolvedValue(undefined);
      
      const result = await service.resetPassword('valid-token', 'newpassword123');
      
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123');
      expect(result).toEqual({ success: true });
    });
  });
  
  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false
      };
      
      mockUsersService.findById.mockResolvedValue(unverifiedUser);
      
      await service.resendVerificationEmail(unverifiedUser.id);
      
      expect(mockUsersService.findById).toHaveBeenCalledWith(unverifiedUser.id);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        unverifiedUser.email,
        unverifiedUser.name,
        unverifiedUser.emailVerifyToken
      );
    });
    
    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      
      await expect(service.resendVerificationEmail('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
        
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestException if email is already verified', async () => {
      const verifiedUser = {
        ...mockUser,
        emailVerified: true
      };
      
      mockUsersService.findById.mockResolvedValue(verifiedUser);
      
      await expect(service.resendVerificationEmail(verifiedUser.id))
        .rejects.toThrow(BadRequestException);
        
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
    
    it('should regenerate token if not present', async () => {
      const userWithoutToken = {
        ...mockUser,
        emailVerified: false,
        emailVerifyToken: null
      };
      
      const updatedUser = {
        ...userWithoutToken,
        emailVerifyToken: 'new-verification-token'
      };
      
      mockUsersService.findById.mockResolvedValue(userWithoutToken);
      mockUsersService.regenerateEmailVerifyToken.mockResolvedValue(updatedUser);
      
      await service.resendVerificationEmail(userWithoutToken.id);
      
      expect(mockUsersService.regenerateEmailVerifyToken).toHaveBeenCalledWith(userWithoutToken.id);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        userWithoutToken.email,
        userWithoutToken.name,
        'new-verification-token'
      );
    });
    
    it('should throw BadRequestException if token generation fails', async () => {
      const userWithoutToken = {
        ...mockUser,
        emailVerified: false,
        emailVerifyToken: null
      };
      
      const updatedUserStillNoToken = {
        ...userWithoutToken,
        emailVerifyToken: null
      };
      
      mockUsersService.findById.mockResolvedValue(userWithoutToken);
      mockUsersService.regenerateEmailVerifyToken.mockResolvedValue(updatedUserStillNoToken);
      
      await expect(service.resendVerificationEmail(userWithoutToken.id))
        .rejects.toThrow(BadRequestException);
        
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
}); 