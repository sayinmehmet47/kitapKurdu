import nodemailer from 'nodemailer';
import { logger } from '../../logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Only initialize transporter if email credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      logger.info(
        `Initializing email service with user: ${process.env.EMAIL_USER}`
      );
      logger.info(
        `Password length: ${process.env.EMAIL_PASS.length} characters`
      );

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // false for port 587 with STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        debug: true, // Enable debug logs
        logger: true,
      });
      logger.info('Email service initialized successfully');
    } else {
      logger.warn(
        'Email service not initialized - missing EMAIL_USER or EMAIL_PASS environment variables'
      );
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email service not configured - skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'KitapKurdu'}" <${
          process.env.EMAIL_FROM || process.env.EMAIL_USER
        }>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email sent successfully to ${options.to}: ${result.messageId}`
      );
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    username: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${
      process.env.CLIENT_URL || 'http://localhost:3000'
    }/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container {
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              background-color: #4f46e5;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 30px;
              background-color: #f9fafb;
            }
            .button {
              display: inline-block;
              background-color: #4f46e5;
              color: white !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to KitapKurdu!</h1>
            </div>
            <div class="content">
              <h2>Hi ${username},</h2>
              <p>Thank you for registering with KitapKurdu. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              
              <p><strong>This verification link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with KitapKurdu, you can safely ignore this email.</p>
              
              <p>Best regards,<br>The KitapKurdu Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} KitapKurdu. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your KitapKurdu account',
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${
      process.env.CLIENT_URL || 'http://localhost:3000'
    }/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container {
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              background-color: #ef4444;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 30px;
              background-color: #f9fafb;
            }
            .button {
              display: inline-block;
              background-color: #ef4444;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${username},</h2>
              <p>We received a request to reset your password for your KitapKurdu account. Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              
              <p><strong>This reset link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>The KitapKurdu Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} KitapKurdu. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset your KitapKurdu password',
      html,
    });
  }
}

export const emailService = new EmailService();
