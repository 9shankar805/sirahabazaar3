/**
 * Email Service for Password Reset
 * Provides fallback email functionality when Firebase is not available
 */

import * as nodemailer from 'nodemailer';

export interface PasswordResetEmail {
  to: string;
  resetToken: string;
  userName: string;
}

export class EmailService {
  private static transporter: any = null;

  static async initialize() {
    try {
      // Use SendGrid SMTP settings
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false, // Use TLS
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY || ''
        }
      });
      return true;
    } catch (error) {
      console.warn('Email service initialization failed:', error);
      return false;
    }
  }

  /**
   * Send password reset email with custom template
   */
  static async sendPasswordResetEmail(emailData: PasswordResetEmail): Promise<boolean> {
    try {
      if (!this.transporter) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Email service not available');
        }
      }

      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${emailData.resetToken}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - Siraha Bazaar</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Siraha Bazaar</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${emailData.userName},</p>
              <p>We received a request to reset your password for your Siraha Bazaar account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${resetLink}">${resetLink}</a></p>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Siraha Bazaar. All rights reserved.</p>
              <p>Contact us: sirahabazzar@gmail.com | +9779805916598</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: '"Siraha Bazaar" <noreply@sirahabazaar.com>',
        to: emailData.to,
        subject: 'Reset Your Password - Siraha Bazaar',
        html: htmlContent,
        text: `
          Password Reset Request - Siraha Bazaar
          
          Hello ${emailData.userName},
          
          We received a request to reset your password for your Siraha Bazaar account.
          
          Please visit this link to reset your password:
          ${resetLink}
          
          This link will expire in 1 hour for security reasons.
          
          If you didn't request this password reset, please ignore this email.
          
          Best regards,
          Siraha Bazaar Team
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully to:', emailData.to);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Check if email service is available
   */
  static isAvailable(): boolean {
    return this.transporter !== null;
  }
}