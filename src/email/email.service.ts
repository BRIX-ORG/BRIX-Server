import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import mjml2html from 'mjml';
import * as fs from 'fs';
import * as path from 'path';

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface EmailTemplateData {
    [key: string]: string | number;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly fromEmail: string;
    private readonly fromName: string;
    private readonly isConfigured: boolean;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@brix.com');
        this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'BRIX');

        // Check if email is properly configured
        this.isConfigured = !!(apiKey && this.fromEmail);

        if (apiKey) {
            sgMail.setApiKey(apiKey);
            this.logger.log('SendGrid configured successfully');
        } else {
            this.logger.warn('SendGrid API key not configured. Emails will not be sent.');
        }
    }

    async sendEmail(options: SendEmailOptions): Promise<void> {
        // Check configuration before attempting to send
        if (!this.isConfigured) {
            this.logger.warn('Email not configured. Skipping email send.');
            this.logger.warn(`Would send to: ${options.to}`);
            this.logger.warn(`Subject: ${options.subject}`);
            return; // Don't throw - graceful degradation
        }

        const startTime = Date.now();
        try {
            this.logger.log(`[${startTime}] Sending email to ${options.to} via SendGrid...`);

            await sgMail.send({
                to: options.to,
                from: {
                    email: this.fromEmail,
                    name: this.fromName,
                },
                subject: options.subject,
                html: options.html,
            });

            const duration = Date.now() - startTime;
            this.logger.log(`[${duration}ms] Email sent to ${options.to}`);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`[${duration}ms] Failed to send email to ${options.to}`);

            // Log error details if available
            if (error instanceof Error) {
                this.logger.error(error.message);
            }

            throw new Error('Failed to send email');
        }
    }

    renderTemplate(templateName: string, data: EmailTemplateData): string {
        try {
            const templatePath = path.join(__dirname, 'templates', `${templateName}.mjml`);

            // Check if template exists
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template file not found: ${templatePath}`);
            }

            let mjmlContent = fs.readFileSync(templatePath, 'utf-8');

            // Replace template variables
            Object.entries(data).forEach(([key, value]) => {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                mjmlContent = mjmlContent.replace(regex, String(value));
            });

            // Compile MJML to HTML
            const result = mjml2html(mjmlContent);
            const { html, errors } = result;

            // Check for MJML compilation errors
            if (errors && errors.length > 0) {
                this.logger.error('MJML compilation errors:', errors);
                throw new Error('MJML compilation failed');
            }

            return html;
        } catch (error) {
            this.logger.error(`Failed to render template ${templateName}`);
            if (error instanceof Error) {
                this.logger.error(error.message);
            }
            throw new Error(`Failed to render email template: ${templateName}`);
        }
    }

    async sendForgotPasswordOtp(email: string, otp: string): Promise<void> {
        const html = this.renderTemplate('forgot-password-otp', { otp, email });
        await this.sendEmail({
            to: email,
            subject: 'BRIX Security - OTP Verification',
            html,
        });
    }

    async sendEmailVerification(email: string, otp: string): Promise<void> {
        const html = this.renderTemplate('verify-email', { otp, email });
        await this.sendEmail({
            to: email,
            subject: 'BRIX - Verify Your Email',
            html,
        });
    }

    async sendPasswordResetSuccess(email: string): Promise<void> {
        const html = this.renderTemplate('password-reset-success', { email });
        await this.sendEmail({
            to: email,
            subject: 'BRIX Security - Password Reset Successful',
            html,
        });
    }

    async sendWelcomeEmail(email: string, appUrl: string = 'https://brix.social'): Promise<void> {
        const html = this.renderTemplate('welcome', { email, appUrl });
        await this.sendEmail({
            to: email,
            subject: 'Welcome to BRIX - Join the Grid',
            html,
        });
    }
}
