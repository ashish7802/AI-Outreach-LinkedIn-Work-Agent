import React from 'react';
import { repository } from '@/lib/db/repository';
import { BarChart3, Download, CheckCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const reports = await repository.getReports();
  const scanRuns = await repository.getScanRuns();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <span>Execution Reports & Scan History</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic reporting reflecting true database and provider events—never model guesses.
          </p>
        </div>
        <a
          href="/api/reports/export?type=reports"
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Reports CSV</span>
        </a>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-semibold text-sm text-slate-200">
          Generated Execution Reports
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">Sent</th>
                <th className="py-3 px-4">Delivered</th>
                <th className="py-3 px-4">Replies</th>
                <th className="py-3 px-4">Opt-Outs</th>
                <th className="py-3 px-4">Next Actions Planned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-300">{r.id}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(r.scan_period_start).toLocaleDateString()} -{' '}
                    {new Date(r.scan_period_end).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{r.leads_processed}</td>
                  <td className="py-3 px-4 text-indigo-400 font-semibold">{r.messages_sent}</td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold">{r.messages_delivered}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{r.replies_received}</td>
                  <td className="py-3 px-4 text-slate-400">{r.opt_outs_count}</td>
                  <td className="py-3 px-4">
                    <span className="text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded text-[11px]">
                      {r.next_actions?.length || 0} candidate actions
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scan Runs Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-sm text-slate-200">Scheduled Scan Runs</h3>
        <div className="space-y-2">
          {scanRuns.map((sr) => (
            <div
              key={sr.id}
              className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono text-slate-300 font-medium">{sr.scan_type}</span>
                <span className="text-slate-500 ml-2">via {sr.trigger_source}</span>
                {sr.error_message && (
                  <div className="text-rose-400 text-[11px] mt-1">{sr.error_message}</div>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                    sr.status === 'completed'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : sr.status === 'running'
                      ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                  }`}
                >
                  {sr.status}
                </span>
                <div className="text-slate-500 text-[10px] mt-1">
                  {new Date(sr.started_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
