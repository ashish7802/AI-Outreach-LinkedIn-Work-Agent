import React from 'react';
import { repository } from '@/lib/db/repository';
import { Plug, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const integrations = await repository.getIntegrations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Plug className="h-5 w-5 text-indigo-400" />
          <span>Connected Integrations & Platform Permissions</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Honest status reporting. No fabricated or simulated browser sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const isConnected = item.status === 'connected';
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-200 capitalize">
                    {item.provider.replace('_', ' ')}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Category: {item.category}
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded font-medium uppercase tracking-wider ${
                    isConnected
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account / Identity:</span>
                  <span className="font-mono text-slate-300">
                    {item.account_identifier || 'None'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Granted Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.granted_permissions.length > 0 ? (
                      item.granted_permissions.map((p) => (
                        <span
                          key={p}
                          className="bg-slate-950 px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 border border-slate-800"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        No active permissions granted
                      </span>
                    )}
                  </div>
                </div>

                {item.settings?.note && (
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-slate-400">
                    {item.settings.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
