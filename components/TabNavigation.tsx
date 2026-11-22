'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TabType } from '@/lib/types';
import {
  FileText,
  BarChart3,
  Shield,
  Boxes,
  Activity,
} from 'lucide-react';

interface TabNavigationProps {
  currentTab: TabType;
}

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'history', label: 'Stats & Metrics', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'ecosystem', label: 'Ecosystem', icon: Boxes },
  { id: 'health', label: 'Health', icon: Activity },
];

export function TabNavigation({ currentTab }: TabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // Normalize legacy tab names ('dependencies' and 'alternatives') to 'ecosystem'
  const normalizedTab = (currentTab === 'dependencies' || currentTab === 'alternatives') ? 'ecosystem' : currentTab;

  const handleTabChange = (tabId: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', tabId);
    router.push(`/?${params.toString()}`);
  };

  // Apple-style sliding indicator calculation
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${normalizedTab}"]`);
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [normalizedTab]);

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <nav
        ref={navRef}
        className="relative flex items-center gap-1 border-b border-[#e8e8e8] pb-1"
      >
        {/* Animated Sliding Active Indicator (Apple-style continuous spatial feedback) */}
        {indicatorStyle.width > 0 && (
          <div
            className="absolute bottom-0 h-[2.5px] bg-[#1d53c6] rounded-full pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        )}

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = normalizedTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-[13.5px] font-semibold select-none cursor-pointer rounded-t-[10px] transition-all duration-150 active:scale-[0.96] active:translate-y-[1px] ${
                isActive
                  ? 'text-[#1d53c6] bg-white'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-transform duration-150 ${
                  isActive ? 'text-[#1d53c6] scale-110' : 'text-[#94a3b8]'
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
