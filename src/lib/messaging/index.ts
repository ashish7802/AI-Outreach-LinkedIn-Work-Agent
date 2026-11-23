import { MessagingAdapter } from './types';
import { ResendAdapter } from './resend-adapter';
import { MockMessagingAdapter } from './mock-adapter';
import { LinkedInOfficialAdapter } from './linkedin-adapter';

const resend = new ResendAdapter();
const mockAdapter = new MockMessagingAdapter();
export const linkedInAdapter = new LinkedInOfficialAdapter();

export function getMessagingAdapter(channel: string): MessagingAdapter {
  if (channel === 'email') {
    // If RESEND_API_KEY is configured, use Resend, else fallback to mock adapter
    if (process.env.RESEND_API_KEY) {
      return resend;
    }
    return mockAdapter;
  }

  if (channel === 'mock_channel') {
    return mockAdapter;
  }

  // Fallback
  return mockAdapter;
}

export * from './types';
export * from './resend-adapter';
export * from './mock-adapter';
export * from './linkedin-adapter';
