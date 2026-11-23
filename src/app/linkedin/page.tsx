'use client';

import React, { useState } from 'react';
import {
  Share2,
  Sparkles,
  CheckCircle,
  Copy,
  AlertCircle,
  Clock,
  Send,
  Eye,
  FileText,
} from 'lucide-react';

export default function LinkedInHubPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'drafts' | 'calendar'>('audit');
  const [headline, setHeadline] = useState(
    'Full-Stack Software Engineer | AI Workflows & Distributed Systems'
  );
  const [about, setAbout] = useState(
    'Software engineer with experience across Next.js, Node.js, and TypeScript. Interested in autonomous workflows and building scalable architectures.'
  );
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);

  const [postTopic, setPostTopic] = useState('Deterministic AI Send Policies');
  const [postEvidence, setPostEvidence] = useState(
    'Implemented an idempotent queue with Zod validation and timezone-aware quiet hours in Asia/Kolkata.'
  );
  const [drafting, setDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<any>(null);

  const [copied, setCopied] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const res = await fetch('/api/linkedin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          about,
          experience: ['Senior Full-Stack Engineer', 'Frontend Specialist'],
          skills: ['Next.js', 'TypeScript', 'Supabase', 'AI Agents'],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuditResult(data.audit);
      }
    } catch {
      //
    } finally {
      setAuditing(false);
    }
  };

  const handleDraftPost = async () => {
    setDrafting(true);
    try {
      const res = await fetch('/api/linkedin/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: postTopic,
          projectOrLearningEvidence: postEvidence,
          targetAudience: 'Software Engineers, Tech Leads, and AI Architects',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDraftResult(data.draft);
      }
    } catch {
      //
    } finally {
      setDrafting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAttemptPublish = async (draftId: string) => {
    try {
      const res = await fetch('/api/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draftId }),
      });
      const data = await res.json();
      if (data.result?.status === 'unavailable') {
        setPublishFeedback(
          `Official API Notice: ${data.result.reason}\n\nReady copy has been prepared below for one-click publishing.`
        );
      } else if (data.result?.status === 'published') {
        setPublishFeedback('Post successfully published via official LinkedIn API!');
      }
    } catch (err: any) {
      setPublishFeedback(`Publish error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-indigo-400" />
            <span>LinkedIn Work & Profile Hub</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Audit your real profile, generate authentic work drafts, and prepare ready-to-publish copy.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile Audit
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'drafts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Draft Generator
          </button>
        </div>
      </div>

      {/* Integration Notice Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs flex items-start space-x-3 text-slate-300">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-100">API Authorization Notice: </span>
          In accordance with platform safety policies, direct publishing requires connected LinkedIn OAuth
          with <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded">w_member_social</code>. When
          unconfigured, the system generates ready-to-copy drafts rather than simulating unauthorized browser
          sessions.
        </div>
      </div>

      {/* TAB 1: Profile Audit */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200">Current Profile Information</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">About Summary</label>
                <textarea
                  rows={6}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleRunAudit}
                disabled={auditing}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{auditing ? 'Auditing with Model...' : 'Run Profile Audit'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200">Optimization Suggestions</h3>
            {auditResult ? (
              <div className="space-y-4 text-xs">
                {/* Score */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Positioning Score:</span>
                  <span className="text-base font-bold text-emerald-400">
                    {auditResult.headline_evaluation.score} / 100
                  </span>
                </div>

                {/* Recommended Headlines */}
                <div className="space-y-2">
                  <span className="font-medium text-indigo-400 block">Recommended Headlines:</span>
                  {auditResult.headline_evaluation.recommended_headlines.map((hl: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-slate-300 flex items-start justify-between gap-2"
                    >
                      <span>{hl}</span>
                      <button
                        onClick={() => handleCopy(hl)}
                        className="text-slate-500 hover:text-indigo-400 shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Recommended About Copy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-emerald-400">Recommended About Copy:</span>
                    <button
                      onClick={() =>
                        handleCopy(auditResult.about_summary_evaluation.recommended_replacement_copy)
                      }
                      className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800/80 text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {auditResult.about_summary_evaluation.recommended_replacement_copy}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-12 text-center">
                Click &quot;Run Profile Audit&quot; to inspect gaps and generate positioning recommendations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Draft Generator */}
      {activeTab === 'drafts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200">Post Topic & Verifiable Evidence</h3>
            <p className="text-xs text-slate-400">
              The model drafts posts strictly grounded in your actual work and engineering learnings.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Topic</label>
                <input
                  type="text"
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value)}
                  className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Real Evidence / Architecture Details</label>
                <textarea
                  rows={4}
                  value={postEvidence}
                  onChange={(e) => setPostEvidence(e.target.value)}
                  className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200"
                />
              </div>

              <button
                onClick={handleDraftPost}
                disabled={drafting}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{drafting ? 'Generating Draft...' : 'Generate Authentic Post Draft'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200">Draft Preview & Publishing</h3>

            {draftResult ? (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-200 text-sm">{draftResult.title}</div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {draftResult.content}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(draftResult.tags || []).map((t: string) => (
                    <span key={t} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleCopy(draftResult.content)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Post Text'}</span>
                  </button>

                  <button
                    onClick={() => handleAttemptPublish(draftResult.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Publish via API</span>
                  </button>
                </div>

                {publishFeedback && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded text-amber-300 whitespace-pre-wrap text-[11px]">
                    {publishFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-12 text-center">
                Provide real engineering evidence to generate an authentic post draft.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
