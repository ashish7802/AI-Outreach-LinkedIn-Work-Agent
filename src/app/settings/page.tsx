import React from 'react';
import { repository } from '@/lib/db/repository';
import { Settings, Shield, Globe, Clock, Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const workspace = await repository.getWorkspace();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-indigo-400" />
          <span>Workspace Policies & Configuration</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Server-side policy parameters controlling quiet hours, rate limits, and scan intervals.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-xs">
        {/* Workspace Identity */}
        <div className="border-b border-slate-800 pb-4 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">General Workspace</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Workspace ID</label>
              <input
                type="text"
                disabled
                value={workspace.id}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Workspace Name</label>
              <input
                type="text"
                disabled
                value={workspace.name}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Policy Guardrails */}
        <div className="border-b border-slate-800 pb-4 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">Send Policy Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Engine Timezone</label>
              <input
                type="text"
                disabled
                value={workspace.timezone}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Quiet Hours Start (24hr)</label>
              <input
                type="text"
                disabled
                value={`${workspace.quiet_hours_start}:00 (9:00 PM)`}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Quiet Hours End (24hr)</label>
              <input
                type="text"
                disabled
                value={`${workspace.quiet_hours_end}:00 (8:00 AM)`}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-slate-400 block mb-1">Daily Send Cap (Per Channel)</label>
              <input
                type="text"
                disabled
                value={`${workspace.daily_send_cap} messages / day`}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Active Handoff Mode</label>
              <input
                type="text"
                disabled
                value="API Orchestration & Manual Handoff"
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-indigo-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Scan Automation */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">Scheduled Trigger Endpoints</h3>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
            <div>Morning Scan (Lead Research): <span className="text-slate-200">/api/scans/cron?job=morning</span></div>
            <div>Midday Scan (Reply Collection): <span className="text-slate-200">/api/scans/cron?job=midday</span></div>
            <div>Evening Scan (Reporting & Follow-up): <span className="text-slate-200">/api/scans/cron?job=evening</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
