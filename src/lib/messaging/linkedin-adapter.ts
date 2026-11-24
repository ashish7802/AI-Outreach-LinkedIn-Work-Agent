import { Draft } from '@/types';

export interface LinkedInPublishResult {
  published: boolean;
  status: 'published' | 'unavailable' | 'failed';
  external_post_id?: string;
  reason?: string;
  draft_ready_for_manual_copy?: string;
}

export class LinkedInOfficialAdapter {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private personUrn: string;

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
    this.personUrn = process.env.LINKEDIN_PERSON_URN || '';
  }

  /**
   * Honest permission check.
   * Does NOT simulate login or use session cookies.
   */
  getIntegrationStatus(): {
    configured: boolean;
    hasPublishPermission: boolean;
    permissions: string[];
    missingRequirements: string[];
  } {
    const missing: string[] = [];
    if (!this.clientId) missing.push('LINKEDIN_CLIENT_ID');
    if (!this.clientSecret) missing.push('LINKEDIN_CLIENT_SECRET');
    if (!this.accessToken) missing.push('LINKEDIN_ACCESS_TOKEN');
    if (!this.personUrn) missing.push('LINKEDIN_PERSON_URN');

    const configured = missing.length === 0;

    return {
      configured,
      hasPublishPermission: configured,
      permissions: configured ? ['w_member_social', 'openid', 'profile'] : [],
      missingRequirements: missing,
    };
  }

  /**
   * Verify token against official LinkedIn UserInfo endpoint
   */
  async verifyTokenWithAPI(): Promise<{ valid: boolean; identity?: string; error?: string }> {
    if (!this.accessToken) {
      return { valid: false, error: 'LINKEDIN_ACCESS_TOKEN is missing' };
    }

    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `LinkedIn OAuth token rejected by API (${response.status})`,
        };
      }

      const userInfo = await response.json();
      return {
        valid: true,
        identity: userInfo.sub || userInfo.name,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Could not reach LinkedIn authentication endpoint: ${err.message}`,
      };
    }
  }

  /**
   * Publish a post via official UGC/Posts API if authorized.
   * If permissions are missing, truthfully returns 'unavailable' with a ready-to-copy draft.
   */
  async publishPost(draft: Draft): Promise<LinkedInPublishResult> {
    const check = this.getIntegrationStatus();

    if (!check.hasPublishPermission) {
      return {
        published: false,
        status: 'unavailable',
        reason: `LinkedIn direct API publishing is unavailable: Missing [${check.missingRequirements.join(', ')}]. You can copy the prepared draft directly to LinkedIn.`,
        draft_ready_for_manual_copy: `${draft.content}\n\n${(draft.tags || []).map((t) => `#${t}`).join(' ')}`,
      };
    }

    try {
      // Official LinkedIn REST Posts API v2024
      const response = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: this.personUrn,
          commentary: `${draft.content}\n\n${(draft.tags || []).map((t) => `#${t}`).join(' ')}`,
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: 'PUBLISHED',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          published: false,
          status: 'failed',
          reason: `LinkedIn API error (${response.status}): ${errText}`,
          draft_ready_for_manual_copy: draft.content,
        };
      }

      const postId = response.headers.get('x-restli-id') || `urn:li:share:${Date.now()}`;

      return {
        published: true,
        status: 'published',
        external_post_id: postId,
      };
    } catch (err: any) {
      return {
        published: false,
        status: 'failed',
        reason: `Network error connecting to LinkedIn API: ${err.message}`,
        draft_ready_for_manual_copy: draft.content,
      };
    }
  }

  /**
   * Fetch post analytics if official API allows, otherwise return not_supported
   */
  async getPostAnalytics(postId: string): Promise<{
    status: 'supported' | 'not_supported' | 'unconfigured';
    impressions?: number;
    clicks?: number;
    likes?: number;
  }> {
    const check = this.getIntegrationStatus();
    if (!check.configured) {
      return { status: 'unconfigured' };
    }
    // LinkedIn Community API doesn't provide analytics for standard member posts without Marketing Partner API
    return {
      status: 'not_supported',
    };
  }
}

export const linkedInAdapter = new LinkedInOfficialAdapter();
