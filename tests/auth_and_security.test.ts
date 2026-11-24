import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  timingSafeCompare,
  verifyCronSecret,
  authenticateRequest,
} from '@/lib/auth/auth-guard';
import { repository } from '@/lib/db/repository';

describe('Authentication & Security Guardrails', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constant-Time Comparison', () => {
    it('accurately validates identical strings', () => {
      expect(timingSafeCompare('secure_token_123', 'secure_token_123')).toBe(true);
    });

    it('rejects differing strings of same length without timing leak', () => {
      expect(timingSafeCompare('secure_token_123', 'secure_token_456')).toBe(false);
    });

    it('rejects differing strings of different lengths', () => {
      expect(timingSafeCompare('short', 'much_longer_string')).toBe(false);
    });
  });

  describe('Cron Secret Enforcement', () => {
    it('authenticates matching Bearer token against CRON_SECRET', () => {
      process.env.CRON_SECRET = 'secret_cron_passphrase_xyz';
      const req = new Request('http://localhost:3000/api/scans/cron', {
        headers: { Authorization: 'Bearer secret_cron_passphrase_xyz' },
      });

      const result = verifyCronSecret(req);
      expect(result.authorized).toBe(true);
    });

    it('rejects unauthorized or incorrect cron token', () => {
      process.env.CRON_SECRET = 'secret_cron_passphrase_xyz';
      const req = new Request('http://localhost:3000/api/scans/cron', {
        headers: { Authorization: 'Bearer wrong_passphrase' },
      });

      const result = verifyCronSecret(req);
      expect(result.authorized).toBe(false);
      expect(result.error).toContain('Invalid cron secret');
    });

    it('fails closed in production if CRON_SECRET is unconfigured', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CRON_SECRET;

      const req = new Request('http://localhost:3000/api/scans/cron', {
        headers: { Authorization: 'Bearer any_token' },
      });

      const result = verifyCronSecret(req);
      expect(result.authorized).toBe(false);
      expect(result.error).toContain('CRON_SECRET is unconfigured in production');
    });
  });

  describe('Production Storage Fail-Closed Behavior', () => {
    it('disables local JSON filesystem storage when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await expect(repository.getWorkspace()).rejects.toThrow(
        /Local JSON filesystem storage is prohibited in production/i
      );
    });
  });

  describe('Request Authentication', () => {
    it('rejects unauthenticated requests in production', async () => {
      process.env.NODE_ENV = 'production';
      const req = new Request('http://localhost:3000/api/agent/state', {
        method: 'POST',
      });

      const auth = await authenticateRequest(req);
      expect(auth.authorized).toBe(false);
      expect(auth.statusCode).toBe(401);
    });
  });
});
