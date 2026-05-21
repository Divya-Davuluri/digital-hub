import { Resend } from 'resend';
import { config } from '../config/env';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: 'Digital Marketing Hub <onboarding@hubsaas.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      if (response.error) {
        console.error('[EMAIL_ERROR]', response.error);
        return { success: false, error: response.error };
      }
      console.log(`[EMAIL_SENT] to ${options.to}: ${options.subject}`);
      return { success: true, messageId: response.data?.id };
    } catch (error) {
      console.error('[EMAIL_ERROR]', error);
      return { success: false, error };
    }
  } else {
    // Fallback: Log to console and return a mock success so the flow continues
    console.log('--- EMAIL SIMULATION ---');
    console.log(`TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`HTML: ${options.html}`);
    console.log('------------------------');
    return { success: false, message: 'Email provider not configured' };
  }
};
