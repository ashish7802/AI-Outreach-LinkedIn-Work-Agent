import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Supabase Row Level Security (RLS) & Tenant Isolation Verification', () => {
  it('confirms migration 20261123000002 drops all permissive USING (true) policies', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20261123000002_security_hardening.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf8');

    // Verify dropping of all old legacy policies
    expect(content).toContain('DROP POLICY IF EXISTS "Public or Workspace Access leads"');
    expect(content).toContain('DROP POLICY IF EXISTS "Public or Workspace Access campaigns"');
    expect(content).toContain('DROP POLICY IF EXISTS "Public or Workspace Access messages"');

    // Verify presence of workspace tenant access function
    expect(content).toContain('FUNCTION auth_has_workspace_access');

    // Verify strict tenant-isolated policies
    expect(content).toContain('CREATE POLICY "Members access workspace leads"');
    expect(content).toContain('auth_has_workspace_access(workspace_id)');

    // Verify webhook_events server-only table has access revoked from public/authenticated users
    expect(content).toContain('REVOKE ALL ON webhook_events FROM anon, authenticated');
  });
});
