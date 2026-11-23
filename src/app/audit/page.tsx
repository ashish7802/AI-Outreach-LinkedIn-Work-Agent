import React from 'react';
import { repository } from '@/lib/db/repository';
import { ShieldAlert, Download, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const auditLogs = await repository.getAuditEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
            <span>Chronological Audit Log</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Complete non-repudiation log of model instructions, server policy decisions, sends, and webhook events.
          </p>
        </div>
        <a
          href="/api/reports/export?type=audit"
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit CSV</span>
        </a>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-200 font-semibold">{log.event_type}</td>
                  <td className="py-3 px-4 text-indigo-400">{log.actor}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        log.severity === 'critical'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : log.severity === 'warn'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-md font-sans text-slate-300 truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
