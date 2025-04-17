import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Get('test')
  async testMail(@Query('email') email: string) {
    if (!email) {
      return { error: 'Email is required' };
    }

    try {
      await this.mailService.sendVerificationEmail(
        email,
        'Test User',
        'test-verification-token-12345'
      );
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to send email', 
        error: error.message 
      };
    }
  }

  @Get('test-reset')
  async testResetMail(@Query('email') email: string) {
    if (!email) {
      return { error: 'Email is required' };
    }

    try {
      await this.mailService.sendPasswordResetEmail(
        email,
        'Test User',
        'test-reset-token-12345'
      );
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to send password reset email', 
        error: error.message 
      };
    }
  }

  @Get('test-brevo')
  async testBrevoMail(@Query('email') email: string) {
    if (!email) {
      return { error: 'Email is required' };
    }

    try {
      const response = await this.mailService.sendTestEmail(email);
      return { 
        success: true, 
        message: 'Test email sent successfully', 
        messageId: response.body.messageId || 'unknown' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to send test email', 
        error: error.message 
      };
    }
  }
}