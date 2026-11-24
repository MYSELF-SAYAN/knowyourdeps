'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ecosystem, TabType, PackageOverview, ComparisonTarget } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { PackageSidebar } from '@/components/PackageSidebar';
import { TabNavigation } from '@/components/TabNavigation';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { SecurityTab } from '@/components/tabs/SecurityTab';
import { EcosystemTab } from '@/components/tabs/EcosystemTab';
import { HealthTab } from '@/components/tabs/HealthTab';
import { ComparisonModal } from '@/components/ComparisonModal';
import { Footer } from '@/components/Footer';
import { KeycapButton } from '@/components/ui/KeycapButton';
import {
  ShieldAlert,
  Layers,
  TrendingUp,
  Shuffle,
  AlertTriangle,
  Terminal,
  ArrowRight,
  Check,
  Copy,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [copiedSkill, setCopiedSkill] = useState(false);

  const copySkillCmd = () => {
    navigator.clipboard.writeText('npx skills add MYSELF-SAYAN/knowyourdeps');
    setCopiedSkill(true);
    setTimeout(() => setCopiedSkill(false), 2000);
  };

  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const packageName = searchParams.get('package') || '';
  const currentTab = (searchParams.get('type') || 'overview') as TabType;
  const versionParam = searchParams.get('version') || '';

  const [packageData, setPackageData] = useState<PackageOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare modal state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargets, setCompareTargets] = useState<ComparisonTarget[]>([]);

  // Fetch package overview when ecosystem or package changes
  useEffect(() => {
    if (!packageName) {
      setPackageData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchPackage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/package?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Package "${packageName}" not found in ${ecosystem.toUpperCase()} registry.`);
          }
          throw new Error('Failed to retrieve package information');
        }
        const data: PackageOverview = await res.json();
        setPackageData(data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        setPackageData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [ecosystem, packageName]);

  const activeVersion = versionParam || packageData?.latestVersion || 'latest';

  // Handle URL compare query param trigger
  useEffect(() => {
    if (searchParams.get('compare') === 'true' || searchParams.get('compare') === '1') {
      openCompareModalDirect();
    }
  }, [searchParams]);

  const handleSelectTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', tab);
    router.push(`/?${params.toString()}`);
  };

  const handleSelectVersion = (version: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('version', version);
    router.push(`/?${params.toString()}`);
  };

  const openCompareModalWith = (targetPackage: string) => {
    setCompareTargets([
      { ecosystem, name: packageName, version: activeVersion !== 'latest' ? activeVersion : undefined },
      { ecosystem, name: targetPackage },
    ]);
    setIsCompareOpen(true);
  };

  const openCompareModalDirect = () => {
    if (packageName) {
      setCompareTargets([{ ecosystem, name: packageName, version: activeVersion !== 'latest' ? activeVersion : undefined }]);
    } else {
      setCompareTargets([
        { ecosystem: 'npm', name: 'axios' },
        { ecosystem: 'npm', name: 'got' },
      ]);
    }
    setIsCompareOpen(true);
  };

  const POPULAR_PACKAGES: Record<Ecosystem, string[]> = {
    npm: ['axios', 'express', 'react', 'zod', 'next', 'fastify', 'lodash', 'tailwindcss'],
    pypi: ['requests', 'fastapi', 'flask', 'pydantic', 'httpx', 'pandas', 'numpy', 'pytest'],
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a] relative ${
        packageName ? 'lg:h-screen lg:overflow-hidden' : ''
      }`}
    >
      {/* Smokey Sky Atmosphere Aura (tasteskill.dev design system) */}
      {!packageName && (
        <div className="sky-half-screen-bg">
          <div className="sky-clouds-overlay" />
        </div>
      )}

      {/* Centered Floating Animated Navbar */}
      <header className="sticky top-3.5 z-40 w-full flex justify-center px-4 pointer-events-none">
        <Navbar onOpenCompare={openCompareModalDirect} />
      </header>

      {/* When package view is active: Pinned Search Bar with proper breathing space from floating navbar */}
      {packageName && (
        <div className="shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-3 z-20">
          <SearchBar inputRef={searchInputRef} compact />
        </div>
      )}

      {/* Package View Mode: Fixed Workspace (Sidebox & Tabs stay still, only contents scroll) */}
      {packageName ? (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 min-h-0 lg:overflow-hidden flex flex-col">
          {/* Loading state: High-Fidelity Skeleton Package Workspace */}
          {loading && !packageData && (
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-start gap-6 lg:overflow-hidden py-1 animate-in fade-in duration-150">
              {/* Left Column: Sidebar Skeleton */}
              <div className="w-full lg:w-[300px] shrink-0 bg-white border border-[#e8e8e8] rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                {/* Badges placeholder */}
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-12 rounded-[6px] bg-[#f0f0f0] animate-pulse" />
                  <div className="h-5 w-16 rounded-[6px] bg-[#f0f0f0] animate-pulse" />
                  <div className="h-5 w-14 rounded-[6px] bg-[#f0f0f0] animate-pulse" />
                </div>
                {/* Name & description */}
                <div>
                  <div className="h-8 w-44 rounded-[8px] bg-[#f0f0f0] animate-pulse" />
                  <div className="mt-2.5 space-y-1.5">
                    <div className="h-3.5 w-full rounded bg-[#f0f0f0] animate-pulse" />
                    <div className="h-3.5 w-5/6 rounded bg-[#f0f0f0] animate-pulse" />
                    <div className="h-3.5 w-3/4 rounded bg-[#f0f0f0] animate-pulse" />
                  </div>
                </div>
                {/* Security pill skeleton */}
                <div className="h-8 rounded-[10px] bg-[#f0f0f0] animate-pulse" />
                {/* Install box skeleton */}
                <div className="h-10 rounded-[12px] bg-[#f0f0f0] animate-pulse" />
                {/* Links */}
                <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
                  <div className="h-7 rounded-[8px] bg-[#f0f0f0] animate-pulse" />
                  <div className="h-7 rounded-[8px] bg-[#f0f0f0] animate-pulse" />
                  <div className="h-7 rounded-[8px] bg-[#f0f0f0] animate-pulse" />
                </div>
              </div>

              {/* Right Column: Tab Navigation & Content Skeleton */}
              <div className="flex-1 min-w-0 w-full flex flex-col lg:h-full lg:overflow-hidden">
                {/* Pinned Tab bar skeleton */}
                <div className="shrink-0 flex items-center gap-2 pb-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-24 rounded-[12px] bg-white border border-[#e8e8e8] animate-pulse"
                    />
                  ))}
                </div>

                {/* Content body skeleton */}
                <div className="flex-1 min-h-0 space-y-4 pt-1">
                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-white border border-[#e8e8e8] rounded-[18px] p-4 animate-pulse flex flex-col justify-between"
                      >
                        <div className="h-3 w-16 bg-[#f0f0f0] rounded" />
                        <div className="h-7 w-24 bg-[#f0f0f0] rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Main section card shimmer */}
                  <div className="h-[420px] bg-white border border-[#e8e8e8] rounded-[20px] p-6 animate-pulse flex flex-col gap-4">
                    <div className="h-6 w-48 bg-[#f0f0f0] rounded-[8px]" />
                    <div className="h-4 w-full bg-[#f0f0f0] rounded" />
                    <div className="h-4 w-5/6 bg-[#f0f0f0] rounded" />
                    <div className="flex-1 bg-[#fafafa] rounded-[14px] border border-[#f0f0f0]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-white border border-[#fcccd1] rounded-[20px] p-8 text-center flex flex-col items-center my-auto">
              <div className="w-14 h-14 rounded-full bg-[#feecee] text-[#e5484d] flex items-center justify-center mb-4">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="font-sans font-bold text-[18px] text-[#1a1a1a]">Package Not Found</h3>
              <p className="text-[13px] text-[#6e6e6e] max-w-[460px] mt-2 leading-relaxed">
                {error}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={`/?ecosystem=${ecosystem}`}
                  className="px-4 py-2 bg-[#f4f4f4] hover:bg-[#e8e8e8] rounded-[10px] text-[13px] font-semibold text-[#1a1a1a] transition-colors"
                >
                  Back to Search
                </Link>
                <KeycapButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const otherEco = ecosystem === 'npm' ? 'pypi' : 'npm';
                    router.push(`/?ecosystem=${otherEco}&package=${packageName}&type=overview`);
                  }}
                >
                  Try in {ecosystem === 'npm' ? 'PyPI' : 'npm'}
                </KeycapButton>
              </div>
            </div>
          )}

          {/* Package Loaded Workspace */}
          {packageData && !loading && (
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-start gap-6 lg:overflow-hidden py-1">
              {/* Left Column: Sidebox (stays completely still) */}
              <div className="w-full lg:w-[300px] shrink-0 lg:h-full lg:overflow-y-auto scrollbar-none pb-4">
                <PackageSidebar
                  pkg={packageData}
                  activeVersion={activeVersion}
                  onOpenCompare={openCompareModalDirect}
                />
              </div>

              {/* Right Column: Pinned Tabs Bar + Scrollable Content Area */}
              <div className="flex-1 min-w-0 w-full flex flex-col lg:h-full lg:overflow-hidden">
                {/* Pinned Tab Navigation (stays completely still) */}
                <div className="shrink-0 bg-[#fcfcfc] z-10 pb-1">
                  <TabNavigation currentTab={currentTab} />
                </div>

                {/* Scrollable Tab Content Container (JUST CONTENTS SCROLL) */}
                <div className="flex-1 min-h-0 lg:overflow-y-auto pt-3 pb-8 pr-1.5 scrollbar-thin">
                  <div key={currentTab} className="min-h-[400px] animate-tab-in">
                    {currentTab === 'overview' && (
                      <OverviewTab
                        pkg={packageData}
                        activeVersion={activeVersion}
                        onSelectTab={handleSelectTab}
                        onSelectVersion={handleSelectVersion}
                      />
                    )}

                    {currentTab === 'history' && (
                      <HistoryTab
                        ecosystem={ecosystem}
                        packageName={packageData.name}
                        pkg={packageData}
                      />
                    )}

                    {currentTab === 'security' && (
                      <SecurityTab
                        ecosystem={ecosystem}
                        packageName={packageData.name}
                        version={activeVersion}
                        onSelectVersion={handleSelectVersion}
                      />
                    )}

                    {(currentTab === 'ecosystem' || currentTab === 'dependencies' || currentTab === 'alternatives') && (
                      <EcosystemTab
                        ecosystem={ecosystem}
                        packageName={packageData.name}
                        version={activeVersion}
                        onCompareWith={openCompareModalWith}
                        initialSubTab={currentTab === 'alternatives' ? 'alternatives' : 'dependencies'}
                      />
                    )}

                    {currentTab === 'health' && (
                      <HealthTab ecosystem={ecosystem} packageName={packageData.name} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* Landing View: Taste Skill Inspired Smokey Sky Aesthetic with Immense Breathing Space */
        <>
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 desk:px-8 pt-20 sm:pt-28 desk:pt-32 pb-32 sm:pb-40 flex flex-col items-center justify-center text-center relative z-10 animate-in fade-in duration-300">
            {/* Pill badge with pulse dot in taste-skill aesthetic */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#bfdbfe]/80 text-[#1d53c6] font-pixel text-[9.5px] uppercase tracking-wide mb-8 shadow-[0_2px_12px_rgba(14,165,233,0.12)] select-none hover:-translate-y-0.5 transition-transform">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d53c6] shadow-[0_0_8px_#38bdf8]" />
              <span>Package Intelligence &amp; Supply Chain Audit</span>
            </div>

            {/* Single Line Headline with neo-arcade pixel display font */}
            <h1 className="font-display font-bold text-[36px] sm:text-[54px] desk:text-[68px] leading-[1.05] tracking-tight text-[#0f172a] whitespace-normal sm:whitespace-nowrap max-w-5xl">
              Audit packages before you run <span className="text-white bg-[#1d53c6] px-3 py-0.5 rounded-[12px] inline-block shadow-[0_4px_16px_rgba(29,83,198,0.35)]">install.</span>
            </h1>

            {/* Lede sentence with generous breathing space */}
            <p className="mt-5 text-[15px] sm:text-[17px] text-[#475569] max-w-xl mx-auto leading-relaxed">
              Real-time vulnerability audits, supply chain dependency solver, download velocity trends, and OpenSSF scorecards across npm &amp; PyPI.
            </p>

            {/* Centralized Search Bar with tactile depth */}
            <div className="mt-10 sm:mt-12 w-full max-w-2xl">
              <SearchBar inputRef={searchInputRef} />
            </div>

            {/* Popular packages quick pills with pixel label */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl text-[12px]">
              <span className="font-pixel text-[9px] text-[#64748b] uppercase tracking-wider mr-1">
                Trending {ecosystem.toUpperCase()}:
              </span>
              {POPULAR_PACKAGES[ecosystem].map((pkg) => (
                <Link
                  key={pkg}
                  href={`/?ecosystem=${ecosystem}&package=${pkg}&type=overview`}
                  className="font-mono bg-white/80 backdrop-blur-sm border border-[#e2e8f0] hover:border-[#38bdf8] hover:text-[#1d53c6] hover:bg-[#eff6ff] px-3.5 py-1 rounded-full text-[#334155] transition-all duration-180 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.96]"
                >
                  {pkg}
                </Link>
              ))}
            </div>

            {/* Restrained Anti-Slop AI Agent & MCP Integration Indication */}
            <div className="mt-12 w-full max-w-2xl bg-white/85 backdrop-blur-xl border border-[#e2e8f0] rounded-[22px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(14,165,233,0.06)] hover:border-[#bfdbfe] transition-all text-left">
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-pixel text-[8.5px] uppercase tracking-wider text-emerald-700">
                    Live MCP Cloud Server Online
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#475569] bg-[#f8fafc] px-2.5 py-0.5 rounded-full border border-[#e2e8f0]">
                  skills.sh ready
                </span>
              </div>

              <div className="mt-3.5">
                <h3 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#1d53c6]" />
                  <span>Use directly inside Cursor, Claude, Antigravity &amp; VS Code</span>
                </h3>
                <p className="mt-1 text-[13px] text-[#64748b] leading-relaxed">
                  Audit direct and transitive dependencies, check exact semver bounds, and generate compliance reports directly from your AI agent chat.
                </p>
              </div>

              {/* Quick CLI copy box & Link to Docs */}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 flex items-center justify-between bg-[#0f172a] text-[#f8fafc] px-3.5 py-2 rounded-[12px] font-mono text-[12px] border border-[#1e293b] select-all">
                  <span className="truncate text-[#93c5fd]">
                    <span className="text-[#64748b] mr-1.5">$</span>npx skills add MYSELF-SAYAN/knowyourdeps
                  </span>
                  <button
                    type="button"
                    onClick={copySkillCmd}
                    className="ml-2 p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    title="Copy install command"
                  >
                    {copiedSkill ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <Link
                  href="/docs"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[12px] bg-[#1d53c6] hover:bg-[#19409b] text-white text-[12px] font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-xs shrink-0 cursor-pointer"
                >
                  <span>Docs &amp; Setup</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Stageshow Interactive Miniature Product Showcase */}
            {/* <LandingProductStage /> */}
          </main>

          {/* Global Unified Footer */}
          <Footer onOpenCompare={openCompareModalDirect} />
        </>
      )}

      {/* Comparison Drawer / Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialPackages={compareTargets}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <div className="w-8 h-8 border-2 border-[#1d53c6] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
