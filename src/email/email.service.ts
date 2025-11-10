import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = Number(this.configService.get<string>('EMAIL_PORT'));
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (!host || !port || !user || !pass) {
      throw new Error('Email configuration is missing in environment variables');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true si port 465
      auth: { user, pass },
    });
  }

  async sendRegistrationEmail(to: string, childName: string) {
    const user = this.configService.get<string>('EMAIL_USER');

    const mailOptions = {
      from: `"Cleveroo" <${user}>`,
      to,
      subject: 'Registration Successful - Cleveroo',
      html: `<p>Greetings,</p>
             <p>Your child <b>${childName}</b> has been successfully registered in Cleveroo!</p>
             <p>Thank you !</p>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent to', to, 'MessageId:', info.messageId);
    } catch (error) {
      console.error('Error while sending the email', error);
    }
  }

  async sendResetCodeEmail(to: string, code: string) {
    const user = this.configService.get<string>('EMAIL_USER');

    const mailOptions = {
      from: `"Cleveroo 🌈" <${user}>`,
      to,
      subject: '🔐 Your Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #AB47BC;">🌈 Cleveroo</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #AAF0D1, #80DEEA); padding: 30px; border-radius: 15px; text-align: center;">
            <h2 style="color: white; margin-bottom: 20px;">Password Reset Code</h2>
            <p style="color: white; font-size: 16px; margin-bottom: 20px;">
              Use this code to reset your password:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #AB47BC; letter-spacing: 5px;">
                ${code}
              </span>
            </div>
            
            <p style="color: white; font-size: 14px; margin-top: 20px;">
              ⏰ This code will expire in <strong>15 minutes</strong>
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Never share this code with anyone.</p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Reset code sent to', to, 'MessageId:', info.messageId);
    } catch (error) {
      console.error('Error sending reset code email:', error);
      throw new Error('Failed to send reset code email');
    }
  }

}
