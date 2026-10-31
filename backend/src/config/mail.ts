import nodemailer from 'nodemailer';
import { env } from './env';

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface TransportInfo {
  transporter: nodemailer.Transporter;
  isPreview: boolean;
  previewAccount?: nodemailer.TestAccount;
}

let transportInfo: TransportInfo | null = null;

async function getTransporter(): Promise<TransportInfo> {
  if (transportInfo) return transportInfo;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    // Real SMTP credentials provided
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    transportInfo = { transporter, isPreview: false };
    console.log(`📧 Email: Using real SMTP (${env.SMTP_HOST})`);
  } else {
    // Development: use Ethereal test account for email preview
    const previewAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: previewAccount.user, pass: previewAccount.pass },
    });
    transportInfo = { transporter, isPreview: true, previewAccount };
    console.log('📧 Email: No SMTP configured — using Ethereal preview (development mode)');
    console.log(`   Ethereal inbox: https://ethereal.email/login`);
    console.log(`   User: ${previewAccount.user} | Pass: ${previewAccount.pass}`);
  }

  return transportInfo;
}

export async function sendEmail(options: MailOptions): Promise<{ previewUrl?: string }> {
  const { transporter, isPreview } = await getTransporter();

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (isPreview) {
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`📧 DEV EMAIL PREVIEW — "${options.subject}" → ${options.to}`);
    if (previewUrl) {
      console.log(`   Preview URL: ${previewUrl}`);
    }
    return { previewUrl: previewUrl || undefined };
  }

  return {};
}

