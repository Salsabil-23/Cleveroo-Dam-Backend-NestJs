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

  async sendResetPasswordEmail(to: string, resetLink: string) {
  const user = this.configService.get<string>('EMAIL_USER');

  const mailOptions = {
    from: `"Cleveroo" <${user}>`,
    to,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p>
           <p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
  };

  try {
    const info = await this.transporter.sendMail(mailOptions);
    console.log('Reset email sent to', to, 'MessageId:', info.messageId);
  } catch (error) {
    console.error('Error sending reset email', error);
  }
}

}
