'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TabType } from '@/lib/types';
import { BookOpen, TrendingUp, ShieldAlert, Layers, Activity } from 'lucide-react';

interface TabNavigationProps {
  currentTab: TabType;
}

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'history', label: 'Stats & Metrics', icon: TrendingUp },
  { id: 'security', label: 'Security', icon: ShieldAlert },
  { id: 'ecosystem', label: 'Ecosystem', icon: Layers },
  { id: 'health', label: 'Health', icon: Activity },
];

export function TabNavigation({ currentTab }: TabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Normalize old tab params so indicator maps cleanly
  const normalizedTab: TabType =
    currentTab === 'dependencies' || currentTab === 'alternatives' ? 'ecosystem' : currentTab;

  const handleTabChange = (tabId: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', tabId);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <nav
        aria-label="Package report tabs"
        className="inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-2xl bg-white/92 backdrop-blur-xl border border-white/90 p-1.5 shadow-[0_12px_32px_-12px_rgba(3,28,77,0.16)]"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = normalizedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab-id={tab.id}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-[13px] font-semibold select-none cursor-pointer rounded-xl transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6] ${
                isActive
                  ? 'bg-[#0558d6] text-white shadow-[0_4px_12px_-2px_rgba(5,88,214,0.42)]'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#eff6ff]'
              }`}
            >
              <Icon
                aria-hidden={true}
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-[#475569]'
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
