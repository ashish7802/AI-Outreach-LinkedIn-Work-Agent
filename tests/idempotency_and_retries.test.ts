import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SendPolicyEngine } from '@/lib/policy/engine';
import { repository } from '@/lib/db/repository';

describe('Idempotency, Deduplication & Atomic Job Claiming', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('generates deterministic SHA-256 idempotency key for identical inputs', () => {
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
    expect(key1.startsWith('idem_sha256_')).toBe(true);
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

  it('atomically claims a queued job and denies simultaneous claim by second worker', async () => {
    const testJobId = `job_test_atomic_${Date.now()}`;
    await repository.createSendJob({
      id: testJobId,
      workspace_id: 'ws_default_001',
      instruction_id: 'inst_test',
      idempotency_key: `idem_test_claim_${Date.now()}`,
      status: 'queued',
      attempt_count: 0,
      max_attempts: 3,
    });

    // First worker claims the job
    const claim1 = await repository.claimSendJob(testJobId, 'worker_node_A');
    expect(claim1).not.toBeNull();
    expect(claim1?.status).toBe('processing');
    expect(claim1?.locked_by).toBe('worker_node_A');

    // Second concurrent worker attempts to claim the exact same job
    const claim2 = await repository.claimSendJob(testJobId, 'worker_node_B');
    expect(claim2).toBeNull(); // Must fail closed and not double-dispatch!
  });
});
