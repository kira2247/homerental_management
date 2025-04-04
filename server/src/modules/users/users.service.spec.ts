import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './user.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('crypto');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    role: Role.OWNER,
    emailVerified: false,
    emailVerifyToken: 'verify-token',
    failedLoginAttempts: 0,
    isActive: true,
    isLocked: false,
    lockedUntil: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    lastLoginAt: null,
    lastLoginIp: null,
    lastUserAgent: null,
    lastFailedLoginAt: null,
    lastPasswordChangeAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    // Directly create the service with the mock Prisma
    service = new UsersService(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe(mockUser.email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('test-id');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(mockUser.id);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createData = {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
      role: Role.OWNER,
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'verify-token' });
    });

    it('should create new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        ...mockUser,
        email: 'new@example.com',
        name: 'New User'
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createData);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe(createData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createData.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createData.email,
          name: createData.name,
          passwordHash: 'hashed-password',
          role: createData.role,
          emailVerifyToken: 'verify-token',
        }),
      });
    });

    it('should throw ConflictException when email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createData)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      // First findById call
      mockPrisma.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 'test-id') {
          return Promise.resolve(mockUser);
        }
        // For email check
        if (args.where.email === updateData.email) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
      
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.update('test-id', updateData);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe(updateData.name);
      expect(result.email).toBe(updateData.email);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateData,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateData)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ ...mockUser, id: 'other-id' }); // For email check

      await expect(service.update('test-id', { email: 'existing@example.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
    });

    it('should change password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, passwordHash: 'new-hashed-password' });

      await service.changePassword('test-id', 'new-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining({
          passwordHash: 'new-hashed-password',
          lastPasswordChangeAt: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('nonexistent-id', 'new-password')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePassword', () => {
    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should validate password successfully', async () => {
      const user = new User(mockUser);
      const result = await service.validatePassword(user, 'correct-password');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', mockUser.passwordHash);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login information', async () => {
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      const now = new Date();

      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        lastLoginAt: now,
        lastLoginIp: ipAddress,
        lastUserAgent: userAgent,
      });

      await service.updateLastLogin('test-id', ipAddress, userAgent);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining({
          lastLoginAt: expect.any(Date),
          lastLoginIp: ipAddress,
          lastUserAgent: userAgent,
        }),
      });
    });
  });

  describe('incrementFailedLoginAttempts', () => {
    it('should increment failed login attempts and lock account after 5 attempts', async () => {
      // Mock implementation for the first call to findUnique
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4,
      });

      // Mock update to return user with 5 attempts
      mockPrisma.user.update.mockResolvedValueOnce({
        ...mockUser,
        failedLoginAttempts: 5,
      });

      const result = await service.incrementFailedLoginAttempts('test-id');

      // Check that the result is the user with incremented attempts
      expect(result).toBeInstanceOf(User);
      expect(result.failedLoginAttempts).toBe(5);
      
      // Verify the second update was called to lock the account
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'test-id' },
        data: {
          isLocked: true,
          lockedUntil: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.incrementFailedLoginAttempts('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetFailedLoginAttempts', () => {
    it('should reset failed login attempts', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      });

      await service.resetFailedLoginAttempts('test-id');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        },
      });
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        isLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      });

      await service.unlockAccount('test-id');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          isLocked: false,
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerifyToken: null,
      });

      const result = await service.verifyEmail('verify-token');

      expect(result).toBeInstanceOf(User);
      expect(result.emailVerified).toBe(true);
      expect(result.emailVerifyToken).toBeNull();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          emailVerified: true,
          emailVerifyToken: null,
        },
      });
    });

    it('should throw NotFoundException when token is invalid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPasswordResetToken', () => {
    beforeEach(() => {
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'reset-token' });
    });

    it('should create password reset token successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'reset-token',
        resetPasswordExpires: expect.any(Date),
      });

      const result = await service.createPasswordResetToken('test@example.com');

      expect(result.token).toBe('reset-token');
      expect(result.user).toBeInstanceOf(User);
      expect(result.user.resetPasswordToken).toBe('reset-token');
      expect(result.user.resetPasswordExpires).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          resetPasswordToken: 'reset-token',
          resetPasswordExpires: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createPasswordResetToken('nonexistent@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
    });

    it('should reset password successfully', async () => {
      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockPrisma.user.findFirst.mockResolvedValue(userWithToken);
      mockPrisma.user.update.mockResolvedValue({
        ...userWithToken,
        passwordHash: 'new-hashed-password',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      const result = await service.resetPassword('valid-token', 'new-password');

      expect(result).toBeInstanceOf(User);
      expect(result.passwordHash).toBe('new-hashed-password');
      expect(result.resetPasswordToken).toBeNull();
      expect(result.resetPasswordExpires).toBeNull();
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userWithToken.id },
        data: expect.objectContaining({
          passwordHash: 'new-hashed-password',
          resetPasswordToken: null,
          resetPasswordExpires: null,
        }),
      });
    });

    it('should throw NotFoundException when token is invalid or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword('invalid-token', 'new-password')).rejects.toThrow(NotFoundException);
    });
  });
}); 