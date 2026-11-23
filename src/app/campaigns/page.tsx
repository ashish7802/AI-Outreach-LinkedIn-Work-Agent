'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle,
  AlertCircle,
  Upload,
  Play,
  FileCode,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function CampaignsPage() {
  const [instructions, setInstructions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingJobs, setProcessingJobs] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);

  const loadData = async () => {
    try {
      const resState = await fetch('/api/agent/state');
      // For page data we can fetch from our lightweight API
      const res = await fetch('/api/scans/trigger', { method: 'POST', body: JSON.stringify({ scan_type: 'none' }) }).catch(() => null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Default sample instruction for manual handoff demonstration
    setJsonInput(
      JSON.stringify(
        {
          schema_version: 'v1',
          campaign_id: 'cmp_ai_consulting_01',
          generated_at: new Date().toISOString(),
          reasoning_summary: 'Targeted outreach based on public engineering announcements',
          instructions: [
            {
              campaign_id: 'cmp_ai_consulting_01',
              lead_id: 'lead_003',
              contact_name: 'David Chen',
              public_source_url: 'https://nexisanalytics.example.com/press',
              evidence: 'Company raised Series A to build agentic data querying.',
              channel: 'email',
              recipient_identifier: 'david@nexisanalytics.example.com',
              exact_message_text:
                'Hi David,\n\nCongratulations on the Series A announcement for Nexis Analytics. We noticed your focus on agentic data querying and built an idempotent queue system for zero-duplicate agent operations.\n\nWould you be open to exchanging notes on engineering challenges next week?\n\nBest,\nAI Architecture Team',
              message_purpose: 'Initial Series A outreach referencing press release',
              suggested_send_time: new Date(Date.now() + 3600000).toISOString(),
              follow_up_conditions: 'Wait 5 business days',
              constraints: { channel: 'email' },
            },
          ],
        },
        null,
        2
      )
    );
  }, []);

  const handleValidateAndSubmit = async () => {
    setSubmitting(true);
    setValidationResult(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch('/api/instructions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationResult({ success: false, error: `JSON Parse error: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessSendJobs = async () => {
    setProcessingJobs(true);
    setProcessResult(null);
    try {
      const res = await fetch('/api/jobs/process', { method: 'POST' });
      const data = await res.json();
      setProcessResult(data.result);
    } catch (err: any) {
      setProcessResult({ error: err.message });
    } finally {
      setProcessingJobs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Campaigns & Instructions</h2>
          <p className="text-sm text-slate-400 mt-1">
            Support for API Orchestration Mode and Manual Handoff Mode with strict schema validation.
          </p>
        </div>
        <button
          onClick={handleProcessSendJobs}
          disabled={processingJobs}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          <span>{processingJobs ? 'Evaluating Policies...' : 'Process Send Queue'}</span>
        </button>
      </div>

      {processResult && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-1">
          <div className="font-semibold text-slate-200">Send Queue Evaluation Result:</div>
          <div className="text-slate-400">
            Processed: <strong className="text-slate-200">{processResult.processed}</strong> | Sent:{' '}
            <strong className="text-emerald-400">{processResult.sent}</strong> | Blocked by Policy:{' '}
            <strong className="text-amber-400">{processResult.blocked}</strong> | Failed:{' '}
            <strong className="text-rose-400">{processResult.failed}</strong>
          </div>
        </div>
      )}

      {/* Manual Handoff Mode Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileCode className="h-4 w-4 text-indigo-400" />
            <h3 className="font-semibold text-slate-200 text-sm">
              Manual Handoff Mode — Submit Model Instructions
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Schema Version: v1</span>
        </div>

        <p className="text-xs text-slate-400">
          Paste the JSON instructions output from your model API or conversation. Every instruction is
          validated against the Zod schema before anything touches the queue.
        </p>

        <textarea
          rows={12}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full bg-slate-950 font-mono text-xs text-slate-300 p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
          placeholder="Paste model instruction JSON here..."
        />

        <div className="flex items-center justify-between">
          <button
            onClick={handleValidateAndSubmit}
            disabled={submitting}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>{submitting ? 'Validating...' : 'Validate & Queue Instructions'}</span>
          </button>
        </div>

        {validationResult && (
          <div
            className={`p-4 rounded-lg text-xs border ${
              validationResult.success
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
            }`}
          >
            {validationResult.success ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>
                  Validation passed! {validationResult.count} instructions stored and ready for policy check.
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <span>{validationResult.error}</span>
                </div>
                {validationResult.details && (
                  <pre className="mt-2 text-[11px] overflow-x-auto bg-slate-950 p-2 rounded">
                    {JSON.stringify(validationResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
