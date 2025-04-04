import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn().mockImplementation(() => Promise.resolve(true));
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    }),
  };
});

// Mock cho console.log và console.error để tránh in logs khi chạy test
global.console.log = jest.fn();
global.console.error = jest.fn();

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let transporterMock: { sendMail: jest.Mock };

  const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
      switch (key) {
        case 'MAIL_SERVICE':
          return 'gmail';
        case 'MAIL_USER':
          return 'test@example.com';
        case 'MAIL_PASSWORD':
          return 'password';
        case 'MAIL_FROM':
          return 'noreply@example.com';
        case 'MAIL_FROM_NAME':
          return 'Test App';
        case 'FRONTEND_URL':
          return 'https://example.com';
        default:
          return defaultValue;
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    transporterMock = {
      sendMail: jest.fn().mockImplementation(() => Promise.resolve(true))
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(transporterMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize nodemailer transporter with correct config', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'password',
      },
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email with the correct parameters', async () => {
      // Test data
      const email = 'user@example.com';
      const name = 'John Doe';
      const token = 'verification-token-123';
      const expectedUrl = `https://example.com/auth/verify-email?token=${token}`;

      // Call the service method
      await service.sendVerificationEmail(email, name, token);

      // Check if sendMail was called with the correct parameters
      expect(transporterMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Test App" <noreply@example.com>',
          to: email,
          subject: 'Email Verification - Rental Management System',
          html: expect.stringContaining(expectedUrl),
        })
      );

      // Verify the email content includes user name
      expect(transporterMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(name),
        })
      );

      // Check log message
      expect(console.log).toHaveBeenCalledWith(`Verification email sent to ${email}`);
    });

    it('should handle errors when sending verification email fails', async () => {
      // Setup
      const email = 'user@example.com';
      const name = 'John Doe';
      const token = 'verification-token-123';
      
      // Mock error
      const mockError = new Error('Failed to send email');
      transporterMock.sendMail.mockRejectedValueOnce(mockError);
      
      // Call the service method and expect it to throw
      await expect(service.sendVerificationEmail(email, name, token))
        .rejects.toThrow('Failed to send email');
      
      // Check error logging
      expect(console.error).toHaveBeenCalledWith(
        'Error sending verification email:',
        mockError
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email with the correct parameters', async () => {
      // Test data
      const email = 'user@example.com';
      const name = 'John Doe';
      const token = 'reset-token-456';
      const expectedUrl = `https://example.com/auth/reset-password?token=${token}`;

      // Call the service method
      await service.sendPasswordResetEmail(email, name, token);

      // Check if sendMail was called with the correct parameters
      expect(transporterMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Test App" <noreply@example.com>',
          to: email,
          subject: 'Password Reset - Rental Management System',
          html: expect.stringContaining(expectedUrl),
        })
      );

      // Verify the email content includes user name
      expect(transporterMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(name),
        })
      );

      // Check log message
      expect(console.log).toHaveBeenCalledWith(`Password reset email sent to ${email}`);
    });

    it('should handle errors when sending password reset email fails', async () => {
      // Setup
      const email = 'user@example.com';
      const name = 'John Doe';
      const token = 'reset-token-456';
      
      // Mock error
      const mockError = new Error('Failed to send email');
      transporterMock.sendMail.mockRejectedValueOnce(mockError);
      
      // Call the service method and expect it to throw
      await expect(service.sendPasswordResetEmail(email, name, token))
        .rejects.toThrow('Failed to send email');
      
      // Check error logging
      expect(console.error).toHaveBeenCalledWith(
        'Error sending password reset email:',
        mockError
      );
    });
  });
}); 