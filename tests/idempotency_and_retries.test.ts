import { describe, it, expect } from 'vitest';
import { SendPolicyEngine } from '@/lib/policy/engine';

describe('Idempotency & Duplicate Send Protection', () => {
  it('generates deterministic idempotency key for identical inputs', () => {
    const key1 = SendPolicyEngine.generateIdempotencyKey(
      'ws_1',
      'cmp_1',
      'lead_1',
      'test@example.com',
      'Exact message text content'
    );
    const key2 = SendPolicyEngine.generateIdempotencyKey(
      'ws_1',
      'cmp_1',
      'lead_1',
      'test@example.com',
      'Exact message text content'
    );

    expect(key1).toBe(key2);
    expect(key1.startsWith('idem_')).toBe(true);
  });

  it('produces distinct idempotency keys if message or recipient changes', () => {
    const keyA = SendPolicyEngine.generateIdempotencyKey(
      'ws_1',
      'cmp_1',
      'lead_1',
      'test@example.com',
      'Message A'
    );
    const keyB = SendPolicyEngine.generateIdempotencyKey(
      'ws_1',
      'cmp_1',
      'lead_1',
      'test@example.com',
      'Message B'
    );

    expect(keyA).not.toBe(keyB);
  });
});
