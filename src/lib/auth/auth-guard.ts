import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/db/supabase';

export interface AuthContext {
  authorized: boolean;
  userId?: string;
  workspaceId?: string;
  role?: string;
  authType: 'supabase_user' | 'server_api_key' | 'cron_secret' | 'dev_fallback';
  error?: string;
  statusCode: number;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to keep constant-ish time
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extract Bearer token from Authorization header or Cookie
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const apiKeyHeader = req.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }
  return null;
}

/**
 * Verifies if incoming request is authorized for cron / worker trigger
 */
export function verifyCronSecret(req: Request): { authorized: boolean; error?: string } {
  const expectedSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!expectedSecret || expectedSecret.trim() === '') {
    if (isProduction) {
      return {
        authorized: false,
        error: 'CRON_SECRET is unconfigured in production. Refusing execution.',
      };
    }
    // In local development without CRON_SECRET configured, allow but warn
    return { authorized: true };
  }

  const token = extractBearerToken(req) || req.headers.get('x-cron-secret');
  if (!token) {
    return { authorized: false, error: 'Missing cron authorization credential' };
  }

  const isValid = timingSafeCompare(token, expectedSecret.trim());
  if (!isValid) {
    return { authorized: false, error: 'Invalid cron secret' };
  }

  return { authorized: true };
}

/**
 * Authenticates user or server request and verifies workspace ownership/membership
 */
export async function authenticateRequest(
  req: Request,
  options?: {
    allowCronSecret?: boolean;
    allowServerApiKey?: boolean;
    requiredWorkspaceId?: string;
  }
): Promise<AuthContext> {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Check Cron Secret if permitted (e.g. for background jobs / scans)
  if (options?.allowCronSecret) {
    const cronCheck = verifyCronSecret(req);
    if (cronCheck.authorized) {
      return {
        authorized: true,
        workspaceId: process.env.WORKSPACE_ID || 'ws_default_001',
        authType: 'cron_secret',
        statusCode: 200,
      };
    }
  }

  // 2. Check Server-to-Server API Key if configured & permitted
  if (options?.allowServerApiKey && process.env.INTERNAL_API_KEY) {
    const providedKey = extractBearerToken(req);
    if (providedKey && timingSafeCompare(providedKey, process.env.INTERNAL_API_KEY)) {
      return {
        authorized: true,
        workspaceId: process.env.WORKSPACE_ID || 'ws_default_001',
        authType: 'server_api_key',
        statusCode: 200,
      };
    }
  }

  // 3. Supabase User Authentication
  const token = extractBearerToken(req);

  if (isSupabaseConfigured && supabase && token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return {
          authorized: false,
          error: error?.message || 'Invalid or expired Supabase authentication token',
          authType: 'supabase_user',
          statusCode: 401,
        };
      }

      // Verified user: resolve workspace membership
      // In production, derive from user metadata or profile
      const userWorkspaceId =
        (user.user_metadata?.workspace_id as string) ||
        process.env.WORKSPACE_ID ||
        'ws_default_001';

      if (options?.requiredWorkspaceId && options.requiredWorkspaceId !== userWorkspaceId) {
        return {
          authorized: false,
          error: 'Forbidden: Access to specified workspace is not permitted for your user',
          authType: 'supabase_user',
          statusCode: 403,
        };
      }

      return {
        authorized: true,
        userId: user.id,
        workspaceId: userWorkspaceId,
        authType: 'supabase_user',
        statusCode: 200,
      };
    } catch (err: any) {
      return {
        authorized: false,
        error: `Authentication failed: ${err.message}`,
        authType: 'supabase_user',
        statusCode: 401,
      };
    }
  }

  // 4. In Production without valid auth: FAIL CLOSED
  if (isProduction) {
    return {
      authorized: false,
      error: 'Unauthorized: Authentication credential required in production environment',
      authType: 'supabase_user',
      statusCode: 401,
    };
  }

  // 5. Local Development Fallback (Only active when NOT in production)
  // Allows developing the frontend and running test suite locally without remote Supabase auth token
  return {
    authorized: true,
    userId: 'dev_local_user',
    workspaceId: process.env.WORKSPACE_ID || 'ws_default_001',
    authType: 'dev_fallback',
    statusCode: 200,
  };
}
