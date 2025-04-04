import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    // Khởi tạo transporter với Gmail
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('MAIL_SERVICE', 'gmail'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
    
    this.fromEmail = this.configService.get<string>('MAIL_FROM');
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME');
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const baseUrl = this.configService.get('FRONTEND_URL');
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: email,
      subject: 'Email Verification - Rental Management System',
      html: `
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
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send password reset email to user
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const baseUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: email,
      subject: 'Password Reset - Rental Management System',
      html: `
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
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }
} 