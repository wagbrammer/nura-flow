/**
 * Email Service - Uses IMAP/SMTP instead of Gmail API
 * Works with any email provider (Gmail, Outlook, Proton, etc.)
 */

import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  preview: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  folder: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  security: 'ssl' | 'tls' | 'none';
}

class EmailService {
  private config: EmailConfig | null = null;
  private imap: Imap | null = null;

  /**
   * Initialize email service
   */
  initialize(config: EmailConfig): void {
    this.config = config;
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!this.config?.host && !!this.config?.user && !!this.config?.pass;
  }

  /**
   * Get email status
   */
  getStatus(): { configured: boolean; host?: string; user?: string } {
    return {
      configured: this.isConfigured(),
      host: this.config?.host,
      user: this.config?.user
    };
  }

  /**
   * Connect to IMAP server
   */
  private async connectImap(): Promise<Imap> {
    if (this.imap) return this.imap;

    if (!this.config) {
      throw new Error('Email service not configured');
    }

    this.imap = new Imap({
      user: this.config.user,
      password: this.config.pass,
      host: this.config.host,
      port: this.config.port,
      tls: this.config.security !== 'none',
      tlsOptions: {
        rejectUnauthorized: false // Allow self-signed certs for local dev
      }
    });

    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.imap!);
      });
    });
  }

  /**
   * Get emails from inbox
   */
  async get_emails(page: number = 1, pageSize: number = 20): Promise<{ emails: EmailMessage[]; total: number }> {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured');
    }

    try {
      const imap = await this.connectImap();

      return new Promise((resolve, reject) => {
        const searchCriteria = [['UNSEEN']];
        const f = imap.fetch(`${page * pageSize - pageSize}:${page * pageSize}`, {
          bodies: '',
          struct: true
        });

        const emails: EmailMessage[] = [];
        let total = 0;

        f.on('message', (msg: any) => {
          msg.on('body', (stream: any) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) return;

              emails.push({
                id: parsed.messageId || `email_${Date.now()}_${Math.random()}`,
                subject: parsed.subject || '(Sem assunto)',
                from: parsed.from?.text || 'Desconhecido',
                to: parsed.to?.text || '',
                date: parsed.date?.toISOString() || new Date().toISOString(),
                preview: (parsed.text?.substring(0, 200) || '').replace(/\n/g, ' '),
                body: parsed.text || parsed.html || '',
                isRead: !parsed.date?.toString().includes('UNSEEN'),
                isStarred: false,
                labels: [],
                folder: 'INBOX'
              });

              if (emails.length >= pageSize) {
                f.stop();
              }
            });
          });
        });

        f.on('error', (err) => reject(err));
        f.on('end', () => {
          total = emails.length;
          resolve({ emails, total });
        });

        f.start();
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured');
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.config!.host.replace(/imap\./, 'smtp.'),
        port: this.config!.port,
        secure: this.config!.security === 'ssl',
        auth: {
          user: this.config!.user,
          pass: this.config!.pass
        }
      });

      const info = await transporter.sendMail({
        from: `"NuRa Flow" <${this.config!.user}>`,
        to,
        subject,
        text: body,
        html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${body}</pre>`
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async get_stats(): Promise<{ unread: number; total: number }> {
    if (!this.isConfigured()) {
      return { unread: 0, total: 0 };
    }

    try {
      const imap = await this.connectImap();

      return new Promise((resolve, reject) => {
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          imap.search(['ALL'], (err2, allResults) => {
            if (err2) {
              reject(err2);
              return;
            }
            resolve({
              unread: results?.length || 0,
              total: allResults?.length || 0
            });
          });
        });
      });
    } catch (error) {
      console.error('Error getting email stats:', error);
      return { unread: 0, total: 0 };
    }
  }
}

export const EmailServiceInstance = new EmailService();
export default EmailServiceInstance;
