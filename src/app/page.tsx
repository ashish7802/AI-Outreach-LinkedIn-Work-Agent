import React from 'react';
import { repository } from '@/lib/db/repository';
import {
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const workspace = await repository.getWorkspace();
  const leads = await repository.getLeads();
  const campaigns = await repository.getCampaigns();
  const messages = await repository.getMessages();
  const instructions = await repository.getInstructions();
  const scanRuns = await repository.getScanRuns();
  const auditEvents = await repository.getAuditEvents();

  const latestScan = scanRuns[0];
  const pendingInstructions = instructions.filter((i) => i.validation_status === 'validated');
  const needsReviewCount = instructions.filter((i) => i.validation_status === 'needs_review').length;

  const sentMessages = messages.filter((m) => m.status === 'sent' || m.status === 'delivered');
  const deliveredMessages = messages.filter((m) => m.status === 'delivered');
  const readMessages = messages.filter((m) => m.status === 'read'); // Only verified read
  const replies = messages.filter((m) => m.direction === 'inbound');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <span>Workspace: {workspace.name}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic AI Work Agent with strict policy engine & verifiable status tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Workspace Timezone</span>
            <span className="text-slate-200 font-mono font-medium">{workspace.timezone}</span>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Quiet Hours</span>
            <span className="text-slate-200 font-mono font-medium">
              {workspace.quiet_hours_start}:00 - {workspace.quiet_hours_end}:00
            </span>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Daily Cap</span>
            <span className="text-slate-200 font-mono font-medium">{workspace.daily_send_cap} / channel</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Leads</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{leads.length}</span>
            <span className="text-xs text-slate-500 font-medium">
              {leads.filter((l) => l.status === 'qualified').length} qualified
            </span>
          </div>
        </div>

        {/* Confirmed Sends */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Sent Messages</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{sentMessages.length}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {deliveredMessages.length} confirmed delivered
            </span>
          </div>
        </div>

        {/* Inbound Replies */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Verified Replies</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{replies.length}</span>
            <span className="text-xs text-slate-500">
              {readMessages.length > 0 ? `${readMessages.length} read` : 'Reads: not reported'}
            </span>
          </div>
        </div>

        {/* Needs Review / Errors */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Needs Review</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{needsReviewCount}</span>
            <span className="text-xs text-slate-500">Policy or validation</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Scan Status & Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Scans & Queue State */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily 3-Scan Schedule Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Configured Daily 3-Scan Cycle ({workspace.timezone})</span>
              </h3>
              <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                Active Cron
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div className="font-medium text-slate-300">1. Morning (09:00 IST)</div>
                <div className="text-slate-400 mt-1">Lead Research Scan</div>
                <div className="text-slate-500 text-[11px] mt-2">Extracts & qualifies public business leads</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div className="font-medium text-slate-300">2. Midday (14:00 IST)</div>
                <div className="text-slate-400 mt-1">Reply & Status Collection</div>
                <div className="text-slate-500 text-[11px] mt-2">Syncs webhook events & delivery receipts</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div className="font-medium text-slate-300">3. Evening (18:00 IST)</div>
                <div className="text-slate-400 mt-1">Follow-up & Reporting</div>
                <div className="text-slate-500 text-[11px] mt-2">Evaluates replies & generates model report</div>
              </div>
            </div>

            {latestScan && (
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Last scan: <strong className="text-slate-300">{latestScan.scan_type}</strong> ({latestScan.trigger_source})
                </span>
                <span className="text-emerald-400 font-mono">
                  {new Date(latestScan.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Active Campaigns List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span>Active Campaigns</span>
              </h3>
              <Link href="/campaigns" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center">
                <span>View all</span>
                <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {campaigns.map((c) => {
                const cmpLeads = leads.filter((l) => l.campaign_id === c.id);
                return (
                  <div key={c.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.purpose}</div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2">
                        <span>Channel: <strong className="text-slate-300 font-mono">{c.channel}</strong></span>
                        <span>•</span>
                        <span>Audience: <strong className="text-slate-300">{c.target_audience}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded">
                        {cmpLeads.length} leads
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Log & Truthful Status Policy */}
        <div className="space-y-6">
          {/* Policy Guardrails Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Deterministic Policy Rules</span>
            </h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero model self-send: Server-side policy checks every message before send.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Asia/Kolkata quiet hours enforced (21:00 to 08:00 blocked).</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Idempotent hashing prevents duplicate messages across retries.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>No fabricated read receipts: Marked 'not_supported' if unavailable.</span>
              </li>
            </ul>
          </div>

          {/* Recent Audit Events */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="font-semibold text-slate-200 text-sm">Recent Audit Log</h3>
              <Link href="/audit" className="text-xs text-indigo-400 hover:text-indigo-300">
                Full Log
              </Link>
            </div>
            <div className="space-y-2.5">
              {auditEvents.slice(0, 5).map((ev) => (
                <div key={ev.id} className="text-xs border-l-2 border-slate-700 pl-3 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300 font-medium">{ev.event_type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Actor: <span className="text-slate-300">{ev.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
