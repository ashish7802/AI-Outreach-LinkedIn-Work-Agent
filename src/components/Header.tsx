'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, AlertOctagon, RefreshCw, Zap } from 'lucide-react';

export default function Header() {
  const [agentStatus, setAgentStatus] = useState<'active' | 'paused' | 'stopped'>('active');
  const [sendingStatus, setSendingStatus] = useState<'active' | 'paused'>('active');
  const [loading, setLoading] = useState(false);
  const [triggeringScan, setTriggeringScan] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent/state');
      if (res.ok) {
        const data = await res.json();
        setAgentStatus(data.workspace.agent_status);
        setSendingStatus(data.workspace.sending_status);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/agent/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setAgentStatus(data.workspace.agent_status);
        setSendingStatus(data.workspace.sending_status);
        setStatusMessage(`Action '${action}' applied.`);
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch {
      setStatusMessage('Failed to execute command.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    setTriggeringScan(true);
    try {
      const res = await fetch('/api/scans/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_type: 'full_scan', source: 'manual' }),
      });
      if (res.ok) {
        setStatusMessage('Full scan triggered successfully.');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch {
      setStatusMessage('Error triggering scan.');
    } finally {
      setTriggeringScan(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        {/* Agent Status Badge */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              agentStatus === 'active'
                ? 'bg-emerald-500 animate-pulse'
                : agentStatus === 'paused'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-400">Agent:</span>
          <span
            className={`font-semibold uppercase tracking-wider ${
              agentStatus === 'active'
                ? 'text-emerald-400'
                : agentStatus === 'paused'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {agentStatus}
          </span>
        </div>

        {/* Sending Status Badge */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              sendingStatus === 'active' ? 'bg-cyan-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-400">Sending:</span>
          <span
            className={`font-semibold uppercase tracking-wider ${
              sendingStatus === 'active' ? 'text-cyan-400' : 'text-amber-400'
            }`}
          >
            {sendingStatus}
          </span>
        </div>

        {statusMessage && (
          <span className="text-xs text-indigo-400 bg-indigo-950/40 px-3 py-1 rounded border border-indigo-800/50">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Global Action Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleTriggerScan}
          disabled={triggeringScan || agentStatus !== 'active'}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition disabled:opacity-50"
          title="Run 3-phase scan now"
        >
          <Zap className={`h-3.5 w-3.5 text-amber-400 ${triggeringScan ? 'animate-spin' : ''}`} />
          <span>{triggeringScan ? 'Scanning...' : 'Run Scan Now'}</span>
        </button>

        {/* Pause/Resume Agent */}
        {agentStatus === 'active' ? (
          <button
            onClick={() => handleAction('pause_agent')}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800/60 rounded-lg text-xs font-medium transition"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>Pause Agent</span>
          </button>
        ) : (
          <button
            onClick={() => handleAction('resume_agent')}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-medium transition"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Resume Agent</span>
          </button>
        )}

        {/* Pause/Resume Sending */}
        {sendingStatus === 'active' ? (
          <button
            onClick={() => handleAction('pause_sending')}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition"
          >
            <Pause className="h-3.5 w-3.5 text-amber-400" />
            <span>Pause Sending</span>
          </button>
        ) : (
          <button
            onClick={() => handleAction('resume_sending')}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-medium transition"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Resume Sending</span>
          </button>
        )}

        {/* Stop All Jobs emergency stop */}
        <button
          onClick={() => handleAction('stop_all')}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/70 rounded-lg text-xs font-semibold transition"
          title="Emergency Stop: Halt all queues and background jobs"
        >
          <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
          <span>Stop All</span>
        </button>
      </div>
    </header>
  );
}
