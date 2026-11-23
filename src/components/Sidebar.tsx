'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Send,
  MessageSquare,
  Share2,
  BarChart3,
  Plug,
  Settings,
  ShieldAlert,
  Bot,
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Send },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'LinkedIn Hub', href: '/linkedin', icon: Share2 },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Audit Log', href: '/audit', icon: ShieldAlert },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide">AI WORK AGENT</h1>
          <p className="text-xs text-slate-400">Outreach & LinkedIn Ops</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine Timezone:</span>
          <span className="text-slate-300 font-mono">Asia/Kolkata</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Policy Engine:</span>
          <span className="text-emerald-400 font-medium">Deterministic</span>
        </div>
      </div>
    </aside>
  );
}
