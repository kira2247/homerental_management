import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from '@sendinblue/client';
import { mailLogger } from '../../common/logging';

@Injectable()
export class MailService {
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    // Khởi tạo Brevo API client
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not defined in environment variables');
    }

    // Khởi tạo API instance đúng cách theo tài liệu
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Cấu hình API key
    this.apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    
    this.fromEmail = this.configService.get<string>('MAIL_FROM');
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME');

    mailLogger.log('Brevo Email Service initialized');
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    mailLogger.log(`Preparing verification email for ${email}`);
    const baseUrl = this.configService.get('FRONTEND_URL');
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #0070f3; text-align: center;">Verify Your Email Address</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with our Rental Management System. To complete your registration and verify your email address, please click the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationUrl}" style="background: #0070f3; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't register for an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Rental Management Team</p>
      </div>
    `;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: this.fromEmail, name: this.fromName };
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.subject = 'Email Verification - Rental Management System';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.tags = ['verification'];

    try {
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      mailLogger.log(`Verification email sent to ${email}. Response ID: ${response.body.messageId || 'unknown'}`);
    } catch (error) {
      mailLogger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send password reset email to user
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    mailLogger.log(`Preparing password reset email for ${email}`);
    const baseUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #0070f3; text-align: center;">Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your Rental Management System account. To reset your password, please click the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background: #0070f3; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
        <p>Best regards,<br>The Rental Management Team</p>
      </div>
    `;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: this.fromEmail, name: this.fromName };
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.subject = 'Password Reset - Rental Management System';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.tags = ['password-reset'];

    try {
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      mailLogger.log(`Password reset email sent to ${email}. Response ID: ${response.body.messageId || 'unknown'}`);
    } catch (error) {
      mailLogger.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send notification email to user
   */
  async sendNotificationEmail(
    recipient: { email: string; name: string },
    subject: string,
    htmlContent: string,
    attachments?: Array<{ name: string; content: string; contentType: string }>
  ): Promise<void> {
    mailLogger.log(`Preparing notification email for ${recipient.email}`);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: this.fromEmail, name: this.fromName };
    sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.tags = ['notification'];

    if (attachments && attachments.length > 0) {
      // Brevo API expects attachments in this format
      sendSmtpEmail.attachment = attachments.map(attachment => ({
        name: attachment.name,
        content: attachment.content,
        type: attachment.contentType
      }));
    }

    try {
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      mailLogger.log(`Notification email sent to ${recipient.email}. Response ID: ${response.body.messageId || 'unknown'}`);
    } catch (error) {
      mailLogger.error(`Failed to send notification email to ${recipient.email}`, error);
      throw error;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(email: string): Promise<any> {
    mailLogger.log(`Sending test email to ${email}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #0070f3; text-align: center;">Test Email</h2>
        <p>Hello,</p>
        <p>This is a test email from the Rental Management System using Brevo API.</p>
        <p>If you're receiving this email, it means the email service is working correctly.</p>
        <p>Current time: ${new Date().toLocaleString()}</p>
        <p>Best regards,<br>The Rental Management Team</p>
      </div>
    `;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: this.fromEmail, name: this.fromName };
    sendSmtpEmail.to = [{ email, name: 'Test Recipient' }];
    sendSmtpEmail.subject = 'Test Email - Rental Management System';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.tags = ['test'];

    try {
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      mailLogger.log(`Test email sent to ${email}. Response ID: ${response.body.messageId || 'unknown'}`);
      return response;
    } catch (error) {
      mailLogger.error(`Failed to send test email to ${email}`, error);
      throw error;
    }
  }
}