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
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Terminal,
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

  // Handle URL compare query param trigger
  useEffect(() => {
    if (searchParams.get('compare') === 'true' || searchParams.get('compare') === '1') {
      openCompareModalDirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const POPULAR_PACKAGES: Record<Ecosystem, string[]> = {
    npm: ['axios', 'express', 'react', 'zod', 'next', 'lodash'],
    pypi: ['requests', 'fastapi', 'flask', 'pydantic', 'httpx', 'pytest'],
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-transparent ${
        packageName ? 'lg:h-screen lg:overflow-hidden' : ''
      } text-[#0f172a] relative`}
    >
      {/* Unified Supaste-inspired Sky Atmosphere Spanning Entire Workspace, Landing & Docs */}
      <div className="sky-full-page-bg" aria-hidden="true">
        <div className="sky-clouds-overlay" />
      </div>

      {/* Centered Flush Apple Notch Header */}
      <header className="sticky top-0 z-40 w-full flex justify-center px-3 sm:px-6 pointer-events-none">
        <Navbar onOpenCompare={openCompareModalDirect} />
      </header>

      {/* When package view is active: Search Bar sitting gracefully along the sky horizon */}
      {packageName && (
        <div className="relative shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3.5 z-30">
          <SearchBar inputRef={searchInputRef} compact />
        </div>
      )}

      {/* Package View Mode: Fixed Workspace (Sidebar & Tabs stay still, content scrolls cleanly) */}
      {packageName ? (
        <main id="main-content" className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 min-h-0 lg:overflow-hidden flex flex-col">
          {/* Loading state: Sky-Frosted Skeleton Workspace */}
          {loading && !packageData && (
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-start gap-6 lg:overflow-hidden py-1">
              {/* Left Column: Sidebar Skeleton */}
              <div className="w-full lg:w-[300px] shrink-0 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-5 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.16)] flex flex-col gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-12 rounded-md bg-[#eef5ff] animate-pulse" />
                  <div className="h-5 w-16 rounded-md bg-[#eef5ff] animate-pulse" />
                  <div className="h-5 w-14 rounded-md bg-[#eef5ff] animate-pulse" />
                </div>
                <div>
                  <div className="h-8 w-44 rounded-lg bg-[#eef5ff] animate-pulse" />
                  <div className="mt-2.5 space-y-1.5">
                    <div className="h-3.5 w-full rounded bg-[#f1f6fd] animate-pulse" />
                    <div className="h-3.5 w-5/6 rounded bg-[#f1f6fd] animate-pulse" />
                    <div className="h-3.5 w-3/4 rounded bg-[#f1f6fd] animate-pulse" />
                  </div>
                </div>
                <div className="h-8 rounded-[10px] bg-[#f1f6fd] animate-pulse" />
                <div className="h-10 rounded-[12px] bg-[#f1f6fd] animate-pulse" />
                <div className="space-y-2 pt-2 border-t border-[#e8eef7]">
                  <div className="h-7 rounded-[8px] bg-[#f1f6fd] animate-pulse" />
                  <div className="h-7 rounded-[8px] bg-[#f1f6fd] animate-pulse" />
                  <div className="h-7 rounded-[8px] bg-[#f1f6fd] animate-pulse" />
                </div>
              </div>

              {/* Right Column: Tab Navigation & Content Skeleton */}
              <div className="flex-1 min-w-0 w-full flex flex-col lg:h-full lg:overflow-hidden">
                <div className="shrink-0 flex items-center gap-2 pb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-24 rounded-[12px] bg-white/92 border border-white/90 animate-pulse"
                    />
                  ))}
                </div>

                <div className="flex-1 min-h-0 space-y-4 pt-1">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] p-4 animate-pulse flex flex-col justify-between"
                      >
                        <div className="h-3 w-16 bg-[#eef5ff] rounded" />
                        <div className="h-7 w-24 bg-[#eef5ff] rounded" />
                      </div>
                    ))}
                  </div>

                  <div className="h-[420px] bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-6 animate-pulse flex flex-col gap-4">
                    <div className="h-6 w-48 bg-[#eef5ff] rounded-lg" />
                    <div className="h-4 w-full bg-[#f1f6fd] rounded" />
                    <div className="h-4 w-5/6 bg-[#f1f6fd] rounded" />
                    <div className="flex-1 bg-[#f8fbff] rounded-[14px] border border-[#e8eef7]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-white/95 backdrop-blur-xl border border-[#fcccd1] rounded-[20px] p-8 text-center flex flex-col items-center my-auto shadow-[0_14px_38px_-14px_rgba(3,28,77,0.16)]">
              <div className="w-14 h-14 rounded-full bg-[#feecee] text-[#e5484d] flex items-center justify-center mb-4">
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="font-display font-semibold text-[20px] text-[#0f172a]">Package Not Found</h1>
              <p className="text-[13.5px] text-[#475569] max-w-[460px] mt-2 leading-relaxed">
                {error}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={`/?ecosystem=${ecosystem}`}
                  className="px-4 py-2 bg-[#f1f6fd] hover:bg-[#e2eeff] border border-[#dce7f5] rounded-[10px] text-[13px] font-semibold text-[#0f172a] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                >
                  Back to Search
                </Link>
                <KeycapButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const otherEco = ecosystem === 'npm' ? 'pypi' : 'npm';
                    router.push(`/?ecosystem=${otherEco}&package=${encodeURIComponent(packageName)}&type=overview`);
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
              {/* Left Column: Sidebox (stays still) */}
              <div className="w-full lg:w-[300px] shrink-0 lg:h-full lg:overflow-y-auto scrollbar-none pb-4">
                <PackageSidebar
                  pkg={packageData}
                  activeVersion={activeVersion}
                  onOpenCompare={openCompareModalDirect}
                />
              </div>

              {/* Right Column: Pinned Tabs Bar + Scrollable Content Area */}
              <div className="flex-1 min-w-0 w-full flex flex-col lg:h-full lg:overflow-hidden">
                <div className="shrink-0 z-10 pb-2">
                  <TabNavigation currentTab={currentTab} />
                </div>

                {/* Scrollable Tab Content Container */}
                <div className="flex-1 min-h-0 lg:overflow-y-auto pt-1 pb-8 pr-1.5 scrollbar-thin overscroll-contain">
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
        /* Uncluttered Sky Landing View (Supaste-inspired) */
        <>
          <main id="main-content" className="flex-1 w-full max-w-[920px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 flex flex-col items-center justify-center text-center relative z-10">
            {/* Subtle Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-sans font-medium text-[12px] tracking-wide mb-7 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7dd3fc]" aria-hidden="true" />
              <span>OSV.dev · deps.dev v3 · OpenSSF Scorecard</span>
            </div>

            {/* Hero Display Headline (Host Grotesk + Instrument Serif italic accent) */}
            <h1 className="font-display font-semibold text-[40px] sm:text-[58px] desk:text-[68px] leading-[1.03] tracking-[-0.035em] text-white max-w-4xl text-balance [text-shadow:0_2px_20px_rgba(3,28,77,0.28)]">
              Inspect every dependency{' '}
              <span className="font-serif-accent italic font-normal text-[#dff3ff] tracking-[-0.01em]">
                before install.
              </span>
            </h1>

            {/* Concise Lede */}
            <p className="mt-5 text-[15px] sm:text-[17px] text-[#eaf4ff] max-w-xl mx-auto leading-relaxed">
              Check CVEs across direct and transitive trees, verify OpenSSF health, and resolve conflict-free upgrades for{' '}
              <span translate="no">npm</span> and <span translate="no">PyPI</span>.
            </p>

            {/* Primary Search Bar */}
            <div className="mt-9 sm:mt-10 w-full max-w-2xl">
              <SearchBar inputRef={searchInputRef} />
            </div>

            {/* Quick-Pick Trending Packages */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl text-[12px]">
              <span className="font-sans font-semibold text-[11px] text-white [text-shadow:0_1px_6px_rgba(3,28,77,0.3)] uppercase tracking-wider mr-1">
                Trending <span translate="no">{ecosystem.toUpperCase()}</span>
              </span>
              {POPULAR_PACKAGES[ecosystem].map((pkg) => (
                <Link
                  key={pkg}
                  href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(pkg)}&type=overview`}
                  translate="no"
                  className="font-mono bg-white/92 hover:bg-white border border-white text-[#0f172a] font-medium px-3 py-1 rounded-full shadow-[0_4px_12px_-4px_rgba(3,28,77,0.2)] transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                >
                  {pkg}
                </Link>
              ))}
            </div>

            {/* Minimal, Uncluttered AI Agent Skill & MCP Bar */}
            <div className="mt-10 w-full max-w-xl">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#070b14]/90 backdrop-blur-xl text-white border border-white/15 rounded-2xl p-2 shadow-[0_18px_48px_-14px_rgba(3,28,77,0.38)]">
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Terminal className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" aria-hidden="true" />
                    <code className="font-mono text-[12px] text-[#bae6fd] truncate" translate="no">
                      <span className="text-[#64748b] mr-1.5 select-none">$</span>npx skills add MYSELF-SAYAN/knowyourdeps
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={copySkillCmd}
                    aria-label="Copy skill install command"
                    className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
                  >
                    {copiedSkill ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <Link
                  href="/docs"
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#087cf8] hover:bg-[#1a87f9] text-white text-[12.5px] font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
                >
                  <span>MCP Setup</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
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

export default function HomeClient() {
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
