'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ecosystem, TabType, PackageOverview } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { PackageSidebar } from '@/components/PackageSidebar';
import { TabNavigation } from '@/components/TabNavigation';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { SecurityTab } from '@/components/tabs/SecurityTab';
import { DependenciesTab } from '@/components/tabs/DependenciesTab';
import { AlternativesTab } from '@/components/tabs/AlternativesTab';
import { HealthTab } from '@/components/tabs/HealthTab';
import { ComparisonModal } from '@/components/ComparisonModal';
import { KeycapButton } from '@/components/ui/KeycapButton';
import {
  ShieldAlert,
  Layers,
  TrendingUp,
  Shuffle,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const packageName = searchParams.get('package') || '';
  const currentTab = (searchParams.get('type') || 'overview') as TabType;
  const versionParam = searchParams.get('version') || '';

  const [packageData, setPackageData] = useState<PackageOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare modal state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargets, setCompareTargets] = useState<{ ecosystem: Ecosystem; name: string }[]>([]);

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
      { ecosystem, name: packageName },
      { ecosystem, name: targetPackage },
    ]);
    setIsCompareOpen(true);
  };

  const openCompareModalDirect = () => {
    if (packageName) {
      setCompareTargets([{ ecosystem, name: packageName }]);
    } else {
      setCompareTargets([
        { ecosystem: 'npm', name: 'axios' },
        { ecosystem: 'npm', name: 'got' },
      ]);
    }
    setIsCompareOpen(true);
  };

  const activeVersion = versionParam || packageData?.latestVersion || 'latest';

  const POPULAR_PACKAGES: Record<Ecosystem, string[]> = {
    npm: ['axios', 'express', 'react', 'zod', 'next', 'fastify', 'lodash', 'tailwindcss'],
    pypi: ['requests', 'fastapi', 'flask', 'pydantic', 'httpx', 'pandas', 'numpy', 'pytest'],
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#fcfcfc] text-[#1a1a1a] ${
        packageName ? 'lg:h-screen lg:overflow-hidden' : ''
      }`}
    >
      {/* Centered Floating Animated Navbar */}
      <header className="sticky top-2.5 z-40 w-full flex justify-center px-4 pointer-events-none">
        <Navbar onOpenCompare={openCompareModalDirect} />
      </header>

      {/* When package view is active: Pinned Search Bar (stays completely still) */}
      {packageName && (
        <div className="shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 z-20">
          <SearchBar inputRef={searchInputRef} compact />
        </div>
      )}

      {/* Package View Mode: Fixed Workspace (Sidebox & Tabs stay still, only contents scroll) */}
      {packageName ? (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 min-h-0 lg:overflow-hidden flex flex-col">
          {/* Loading state */}
          {loading && !packageData && (
            <div className="flex flex-col lg:flex-row items-start gap-6 h-full py-4">
              <div className="w-full lg:w-[300px] h-96 bg-white border border-[#e8e8e8] rounded-[20px] animate-pulse p-6" />
              <div className="flex-1 w-full space-y-4">
                <div className="h-12 bg-white border border-[#e8e8e8] rounded-[14px] animate-pulse" />
                <div className="h-96 bg-white border border-[#e8e8e8] rounded-[20px] animate-pulse" />
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

                    {currentTab === 'dependencies' && (
                      <DependenciesTab
                        ecosystem={ecosystem}
                        packageName={packageData.name}
                        version={activeVersion}
                      />
                    )}

                    {currentTab === 'alternatives' && (
                      <AlternativesTab
                        ecosystem={ecosystem}
                        packageName={packageData.name}
                        onCompareWith={openCompareModalWith}
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
        /* Landing View: Normal Document Scroll with Imageory Whitespace & JoinAria Blue Tint */
        <>
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 desk:px-8 pt-8 sm:pt-14 pb-16 flex flex-col items-center justify-center text-center relative animate-in fade-in duration-300">
            {/* Soft Ambient Glacier Blue Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(63,108,201,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

            {/* Badge pill with pulse dot */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0f5ff] border border-[#d6e4ff] text-[#0033ff] text-[12px] font-semibold mb-6 shadow-xs select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0033ff] shadow-[0_0_8px_#0033ff]" />
              <span>Package Intelligence & Supply Chain Audit</span>
            </div>

            {/* Display Headline */}
            <h1 className="font-sans font-bold text-[38px] sm:text-[54px] desk:text-[66px] leading-[1.06] tracking-[-0.04em] text-[#0e0f12] max-w-3xl">
              Audit packages before you run <span className="text-[#0033ff] inline-block">install.</span>
            </h1>

            {/* Lede sentence */}
            <p className="mt-5 text-[16px] sm:text-[18px] text-[#555a64] max-w-xl leading-relaxed">
              Real-time vulnerability audits, supply chain dependency graph solver, download velocity trends, and OpenSSF scorecards across npm and PyPI.
            </p>

            {/* Centralized Search Bar with Imageory tactile depth */}
            <div className="mt-8 sm:mt-10 w-full max-w-2xl">
              <SearchBar inputRef={searchInputRef} />
            </div>

            {/* Popular packages quick pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl text-[12px]">
              <span className="text-[#8c8d94] font-medium mr-1">Trending {ecosystem.toUpperCase()}:</span>
              {POPULAR_PACKAGES[ecosystem].map((pkg) => (
                <Link
                  key={pkg}
                  href={`/?ecosystem=${ecosystem}&package=${pkg}&type=overview`}
                  className="font-mono bg-white/90 border border-[#0000000d] hover:border-[#b2c8f0] hover:text-[#0033ff] hover:bg-[#f4f8ff] px-3 py-1 rounded-full text-[#4a5568] transition-all duration-180 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.96]"
                >
                  {pkg}
                </Link>
              ))}
            </div>
          </main>

          {/* Footer on Landing Page */}
          <footer className="w-full border-t border-[#0000000a] bg-white/50 backdrop-blur-sm py-6 mt-auto text-[12px] text-[#8c8d94]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#0e0f12] tracking-tight">DEPSDIVE</span>
                <span>•</span>
                <span>Package intelligence & supply chain audit engine</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[#6e6e6e]">Zero browser calls to external third-party APIs</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={openCompareModalDirect}
                  className="text-[#0033ff] hover:underline font-medium cursor-pointer"
                >
                  Compare Packages
                </button>
              </div>
            </div>
          </footer>
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
        <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
          <div className="w-8 h-8 border-2 border-[#0033ff] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
