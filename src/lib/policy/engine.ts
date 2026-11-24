import crypto from 'crypto';
import {
  WorkspaceConfig,
  CampaignInstruction,
  SuppressionEntry,
  Integration,
  PolicyEvaluationResult,
} from '@/types';

export class SendPolicyEngine {
  /**
   * Deterministically evaluate if a send instruction is eligible to dispatch.
   * Server-side code decides eligibility, never the AI model.
   */
  static evaluate(params: {
    instruction: CampaignInstruction;
    workspace: WorkspaceConfig;
    integration: Integration | null;
    suppressionList: SuppressionEntry[];
    todaySentCount: number;
    currentTime?: Date; // Allows passing fixed date for testing
  }): PolicyEvaluationResult {
    const { instruction, workspace, integration, suppressionList, todaySentCount } = params;
    const now = params.currentTime || new Date();
    const reasons: string[] = [];

    // 1. Check Global Agent Status
    const agentPaused = workspace.agent_status !== 'active';
    if (agentPaused) {
      reasons.push(`Global agent is currently ${workspace.agent_status}`);
    }

    // 2. Check Global Sending Status
    const sendingPaused = workspace.sending_status !== 'active';
    if (sendingPaused) {
      reasons.push('Workspace sending is currently paused');
    }

    // 3. Integration Authorized & Ready
    let integrationReady = false;
    if (!integration) {
      reasons.push(`No integration found for channel ${instruction.channel}`);
    } else if (integration.status !== 'connected') {
      reasons.push(`Integration '${integration.provider}' is in status: ${integration.status}`);
    } else {
      integrationReady = true;
    }

    // 4. Suppression List (Opt-outs, bounces, blacklists)
    const isSuppressed = suppressionList.some(
      (entry) =>
        entry.recipient_identifier.trim().toLowerCase() ===
          instruction.recipient_identifier.trim().toLowerCase() &&
        (entry.channel === instruction.channel || entry.channel === 'all')
    );
    if (isSuppressed) {
      reasons.push(`Recipient '${instruction.recipient_identifier}' is on suppression/opt-out list`);
    }

    // 5. Quiet Hours Check (Using configured timezone, default Asia/Kolkata)
    const quietHoursActive = this.isQuietHour(
      now,
      workspace.timezone,
      workspace.quiet_hours_start,
      workspace.quiet_hours_end
    );
    if (quietHoursActive) {
      reasons.push(
        `Current time is within quiet hours (${workspace.quiet_hours_start}:00 - ${workspace.quiet_hours_end}:00 ${workspace.timezone})`
      );
    }

    // 6. Daily Cap Check
    const dailyCapExceeded = todaySentCount >= workspace.daily_send_cap;
    if (dailyCapExceeded) {
      reasons.push(
        `Daily channel send cap exceeded (${todaySentCount}/${workspace.daily_send_cap})`
      );
    }

    // 7. Recipient Format Validation
    if (instruction.channel === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(instruction.recipient_identifier)) {
        reasons.push(`Invalid email format: ${instruction.recipient_identifier}`);
      }
    }

    // 8. Exact Message Integrity Check
    if (!instruction.exact_message_text || instruction.exact_message_text.trim().length === 0) {
      reasons.push('Instruction contains empty exact_message_text');
    }

    const passed =
      !agentPaused &&
      !sendingPaused &&
      integrationReady &&
      !isSuppressed &&
      !quietHoursActive &&
      !dailyCapExceeded &&
      reasons.length === 0;

    return {
      passed,
      reasons,
      quiet_hours_active: quietHoursActive,
      suppressed: isSuppressed,
      daily_cap_exceeded: dailyCapExceeded,
      agent_paused: agentPaused,
      sending_paused: sendingPaused,
      integration_ready: integrationReady,
      evaluated_at: now.toISOString(),
    };
  }

  /**
   * Determine if current moment is inside quiet hours in the specified timezone
   */
  static isQuietHour(
    date: Date,
    timeZone: string,
    startHour: number,
    endHour: number
  ): boolean {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hourCycle: 'h23',
      });
      const localHour = parseInt(formatter.format(date), 10);

      // Example: Quiet hours 21 (9 PM) to 8 (8 AM)
      if (startHour > endHour) {
        // Overnight span (e.g., 21 to 8: >= 21 OR < 8)
        return localHour >= startHour || localHour < endHour;
      } else {
        // Same-day span (e.g., 1 to 6)
        return localHour >= startHour && localHour < endHour;
      }
    } catch {
      // Fallback to UTC if timezone is invalid
      const utcHour = date.getUTCHours();
      if (startHour > endHour) {
        return utcHour >= startHour || utcHour < endHour;
      }
      return utcHour >= startHour && utcHour < endHour;
    }
  }

  /**
   * Generate deterministic cryptographic idempotency key for a send job using SHA-256
   */
  static generateIdempotencyKey(
    workspaceId: string,
    campaignId: string,
    leadId: string,
    recipient: string,
    exactMessage: string
  ): string {
    const input = `${workspaceId.trim()}:${campaignId.trim()}:${leadId.trim()}:${recipient.trim().toLowerCase()}:${exactMessage.trim()}`;
    const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    return `idem_sha256_${hash.slice(0, 32)}_${leadId.slice(0, 8)}`;
  }
}
