import React from 'react';
import { repository } from '@/lib/db/repository';
import { MessageSquare, ArrowDownLeft, ArrowUpRight, CheckCheck, Clock, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  const conversations = await repository.getConversations();
  const messages = await repository.getMessages();
  const leads = await repository.getLeads();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Conversations & Inbound Replies</h2>
        <p className="text-sm text-slate-400 mt-1">
          Honest status tracking from actual provider receipts. Read status shown only when supported.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Conversation List */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-mono text-slate-400 tracking-wider">Threads</h3>
          {conversations.map((conv) => {
            const lead = leads.find((l) => l.id === conv.lead_id);
            return (
              <div
                key={conv.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">
                    {lead?.full_name || conv.lead_name || 'Contact'}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      conv.status === 'replied'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {conv.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 line-clamp-2">{conv.latest_message}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Channel: {conv.channel}</span>
                  <span>{new Date(conv.last_activity_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Message Timeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-slate-200">Timeline & Receipts</h3>
            <span className="text-xs text-slate-500">Live Provider Feed</span>
          </div>

          <div className="space-y-4">
            {messages.map((msg) => {
              const isOutbound = msg.direction === 'outbound';
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isOutbound
                      ? 'bg-slate-950/80 border-slate-800 ml-6'
                      : 'bg-emerald-950/20 border-emerald-800/40 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-medium">
                      {isOutbound ? (
                        <>
                          <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-indigo-400">Outbound Message</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Inbound Reply</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-400">Status:</span>
                      <span
                        className={`font-mono font-medium ${
                          msg.status === 'delivered'
                            ? 'text-cyan-400'
                            : msg.status === 'reply_received'
                            ? 'text-emerald-400'
                            : msg.status === 'read'
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                    <span>Ext ID: {msg.external_message_id || 'none'}</span>
                    <span>
                      {msg.sent_at
                        ? new Date(msg.sent_at).toLocaleString()
                        : new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
