import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from '@sendinblue/client';
import { mailLogger } from '../../common/logging';

// Mock Brevo SDK
const mockSendTransacEmail = jest.fn().mockImplementation(() => Promise.resolve({ messageId: 'mock-message-id' }));
const mockSendSmtpEmail = jest.fn().mockImplementation(function() {
  this.sender = {};
  this.to = [];
  this.subject = '';
  this.htmlContent = '';
  this.tags = [];
  this.attachment = [];
  return this;
});

jest.mock('@sendinblue/client', () => ({
  TransactionalEmailsApi: jest.fn().mockImplementation(() => ({
    sendTransacEmail: mockSendTransacEmail,
  })),
  ApiClient: {
    instance: {
      authentications: {
        'api-key': {
          apiKey: ''
        }
      }
    }
  },
  SendSmtpEmail: mockSendSmtpEmail
}));

// Mock cho mailLogger để tránh in logs khi chạy test
jest.mock('../../common/logging', () => ({
  mailLogger: {
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let apiInstanceMock: { sendTransacEmail: jest.Mock };

  const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
      switch (key) {
        case 'BREVO_API_KEY':
          return 'test-api-key';
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
    apiInstanceMock = {
      sendTransacEmail: jest.fn().mockImplementation(() => Promise.resolve({ messageId: 'mock-message-id' }))
    };
    (SibApiV3Sdk.TransactionalEmailsApi as jest.Mock).mockImplementation(() => apiInstanceMock);

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

  it('should initialize Brevo API client with correct config', () => {
    expect(SibApiV3Sdk.TransactionalEmailsApi).toHaveBeenCalled();
    expect(mockConfigService.get).toHaveBeenCalledWith('BREVO_API_KEY');
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

      // Check if sendTransacEmail was called
      expect(apiInstanceMock.sendTransacEmail).toHaveBeenCalled();
      
      // Check that SendSmtpEmail was initialized with correct data
      expect(mockSendSmtpEmail).toHaveBeenCalled();
      
      // Verify the email parameters were set correctly
      expect(mockSendSmtpEmail).toHaveBeenCalled();
      
      // Get the latest instance
      const lastCall = mockSendSmtpEmail.mock.calls.length - 1;
      const sendSmtpEmailInstance = mockSendSmtpEmail.mock.instances[lastCall];
      
      // Check that the properties were set correctly
      expect(sendSmtpEmailInstance.sender).toEqual({ email: 'noreply@example.com', name: 'Test App' });
      expect(sendSmtpEmailInstance.to).toEqual([{ email, name }]);
      expect(sendSmtpEmailInstance.subject).toBe('Email Verification - Rental Management System');
      expect(sendSmtpEmailInstance.htmlContent).toContain(expectedUrl);
      expect(sendSmtpEmailInstance.htmlContent).toContain(name);
      expect(sendSmtpEmailInstance.tags).toEqual(['verification']);

      // Check log message
      expect(mailLogger.log).toHaveBeenCalledWith(`Verification email sent to ${email}. MessageId: mock-message-id`);
    });

    it('should handle errors when sending verification email fails', async () => {
      // Setup
      const email = 'user@example.com';
      const name = 'John Doe';
      const token = 'verification-token-123';
      
      // Mock error
      const mockError = new Error('Failed to send email');
      apiInstanceMock.sendTransacEmail.mockRejectedValueOnce(mockError);
      
      // Call the service method and expect it to throw
      await expect(service.sendVerificationEmail(email, name, token))
        .rejects.toThrow('Failed to send email');
      
      // Check error logging
      expect(mailLogger.error).toHaveBeenCalledWith(
        `Failed to send verification email to ${email}`,
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

      // Check if sendTransacEmail was called
      expect(apiInstanceMock.sendTransacEmail).toHaveBeenCalled();
      
      // Check that SendSmtpEmail was initialized with correct data
      expect(mockSendSmtpEmail).toHaveBeenCalled();
      
      // Verify the email parameters were set correctly
      expect(mockSendSmtpEmail).toHaveBeenCalled();
      
      // Get the latest instance
      const lastCall = mockSendSmtpEmail.mock.calls.length - 1;
      const sendSmtpEmailInstance = mockSendSmtpEmail.mock.instances[lastCall];
      
      // Check that the properties were set correctly
      expect(sendSmtpEmailInstance.sender).toEqual({ email: 'noreply@example.com', name: 'Test App' });
      expect(sendSmtpEmailInstance.to).toEqual([{ email, name }]);
      expect(sendSmtpEmailInstance.subject).toBe('Password Reset - Rental Management System');
      expect(sendSmtpEmailInstance.htmlContent).toContain(expectedUrl);
      expect(sendSmtpEmailInstance.htmlContent).toContain(name);
      expect(sendSmtpEmailInstance.tags).toEqual(['password-reset']);

      // Check log message
      expect(mailLogger.log).toHaveBeenCalledWith(`Password reset email sent to ${email}. MessageId: mock-message-id`);
    });

    it('should handle errors when sending password reset email fails', async () => {
      // Setup
      const email = 'user@example.com';
      const name = 'John Doe';
      const token = 'reset-token-456';
      
      // Mock error
      const mockError = new Error('Failed to send email');
      apiInstanceMock.sendTransacEmail.mockRejectedValueOnce(mockError);
      
      // Call the service method and expect it to throw
      await expect(service.sendPasswordResetEmail(email, name, token))
        .rejects.toThrow('Failed to send email');
      
      // Check error logging
      expect(mailLogger.error).toHaveBeenCalledWith(
        `Failed to send password reset email to ${email}`,
        mockError
      );
    });
  });

  describe('sendNotificationEmail', () => {
    it('should send a notification email with the correct parameters', async () => {
      // Test data
      const recipient = { email: 'user@example.com', name: 'John Doe' };
      const subject = 'Test Notification';
      const htmlContent = '<p>This is a test notification</p>';

      // Call the service method
      await service.sendNotificationEmail(recipient, subject, htmlContent);

      // Check if sendTransacEmail was called
      expect(apiInstanceMock.sendTransacEmail).toHaveBeenCalled();
      
      // Check that SendSmtpEmail was initialized with correct data
      expect(mockSendSmtpEmail).toHaveBeenCalled();
      
      // Get the latest instance
      const lastCall = mockSendSmtpEmail.mock.calls.length - 1;
      const sendSmtpEmailInstance = mockSendSmtpEmail.mock.instances[lastCall];
      
      // Check that the properties were set correctly
      expect(sendSmtpEmailInstance.sender).toEqual({ email: 'noreply@example.com', name: 'Test App' });
      expect(sendSmtpEmailInstance.to).toEqual([{ email: recipient.email, name: recipient.name }]);
      expect(sendSmtpEmailInstance.subject).toBe(subject);
      expect(sendSmtpEmailInstance.htmlContent).toBe(htmlContent);
      expect(sendSmtpEmailInstance.tags).toEqual(['notification']);

      // Check log message
      expect(mailLogger.log).toHaveBeenCalledWith(`Notification email sent to ${recipient.email}. MessageId: mock-message-id`);
    });

    it('should send a notification email with attachments when provided', async () => {
      // Test data
      const recipient = { email: 'user@example.com', name: 'John Doe' };
      const subject = 'Test Notification with Attachment';
      const htmlContent = '<p>This is a test notification with attachment</p>';
      const attachments = [{
        name: 'test.pdf',
        content: 'base64content',
        contentType: 'application/pdf'
      }];

      // Call the service method
      await service.sendNotificationEmail(recipient, subject, htmlContent, attachments);

      // Get the latest SendSmtpEmail instance
      const lastCall = mockSendSmtpEmail.mock.calls.length - 1;
      const sendSmtpEmailInstance = mockSendSmtpEmail.mock.instances[lastCall];
      
      // Verify the email parameters were set correctly
      expect(sendSmtpEmailInstance.attachment).toEqual(attachments);
    });

    it('should handle errors when sending notification email fails', async () => {
      // Setup
      const recipient = { email: 'user@example.com', name: 'John Doe' };
      const subject = 'Test Notification';
      const htmlContent = '<p>This is a test notification</p>';
      
      // Mock error
      const mockError = new Error('Failed to send email');
      apiInstanceMock.sendTransacEmail.mockRejectedValueOnce(mockError);
      
      // Call the service method and expect it to throw
      await expect(service.sendNotificationEmail(recipient, subject, htmlContent))
        .rejects.toThrow('Failed to send email');
      
      // Check error logging
      expect(mailLogger.error).toHaveBeenCalledWith(
        `Failed to send notification email to ${recipient.email}`,
        mockError
      );
    });
  });
});