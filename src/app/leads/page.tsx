import React from 'react';
import { repository } from '@/lib/db/repository';
import { ExternalLink, ShieldCheck, Search, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await repository.getLeads();
  const campaigns = await repository.getCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Verified Leads</h2>
          <p className="text-sm text-slate-400 mt-1">
            Leads researched and qualified strictly from verifiable public information.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/api/reports/export?type=leads"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Contact & Company</th>
                <th className="py-3 px-4">Recipient Identifier</th>
                <th className="py-3 px-4">Evidence & Source</th>
                <th className="py-3 px-4">Fit Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {leads.map((lead) => {
                const campaign = campaigns.find((c) => c.id === lead.campaign_id);
                return (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 text-sm">{lead.full_name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {lead.title ? `${lead.title} • ` : ''}
                        <span className="text-slate-300">{lead.company_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {lead.recipient_identifier}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-300 line-clamp-2">{lead.evidence}</div>
                      {lead.source_url && (
                        <a
                          href={lead.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-1"
                        >
                          <span>Public Source</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                        {lead.fit_score}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wider ${
                          lead.status === 'replied'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : lead.status === 'contacted'
                            ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50'
                            : lead.status === 'queued'
                            ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {campaign?.name || 'Unassigned'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
