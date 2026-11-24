import { MessagingAdapter } from './types';
import { ResendAdapter } from './resend-adapter';
import { MockMessagingAdapter } from './mock-adapter';
import { LinkedInOfficialAdapter } from './linkedin-adapter';

const resend = new ResendAdapter();
const mockAdapter = new MockMessagingAdapter();
export const linkedInAdapter = new LinkedInOfficialAdapter();

export function getMessagingAdapter(channel: string): MessagingAdapter {
  const isProduction = process.env.NODE_ENV === 'production';

  if (channel === 'email') {
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
      return resend;
    }
    if (isProduction) {
      throw new Error(
        'Email integration error: RESEND_API_KEY is missing. Mock messaging fallback is strictly prohibited in production.'
      );
    }
    // Only in non-production development/test mode
    return mockAdapter;
  }

  if (channel === 'mock_channel') {
    if (isProduction) {
      throw new Error('Policy violation: mock_channel cannot be utilized in production environment.');
    }
    return mockAdapter;
  }

  if (channel === 'linkedin_message') {
    throw new Error(
      'Channel linkedin_message direct sending is unavailable: Official LinkedIn 1-to-1 messaging requires certified partner permissions.'
    );
  }

  if (isProduction) {
    throw new Error(`Unsupported or unconfigured channel in production: ${channel}`);
  }

  // Fallback for non-production test harnesses
  return mockAdapter;
}

export * from './types';
export * from './resend-adapter';
export * from './mock-adapter';
export * from './linkedin-adapter';
