'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnalyticsData, Ecosystem, PackageOverview } from '@/lib/types';
import { DownloadChart } from '../charts/DownloadChart';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Loader2,
  Star,
  GitFork,
  AlertTriangle,
  Eye,
  Layers,
  HardDrive,
  FileCode,
  Scale,
  Sparkles,
  Zap,
  Gauge,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HistoryTabProps {
  ecosystem: Ecosystem;
  packageName: string;
  pkg?: PackageOverview;
}

export function HistoryTab({ ecosystem, packageName, pkg }: HistoryTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || '30d';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(
      `/api/package/analytics?ecosystem=${ecosystem}&name=${encodeURIComponent(
        packageName
      )}&period=${currentPeriod}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load analytics');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ecosystem, packageName, currentPeriod]);

  const changePeriod = (p: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', p);
    router.push(`/?${params.toString()}`);
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '—';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 animate-tab-in">
      {/* Header Bar: Title + Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#e8e8e8] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#1a1a1a]">Package Telemetry & Deep Metrics</h2>
            <Badge variant="accent" size="sm">
              {ecosystem.toUpperCase()}
            </Badge>
          </div>
          <p className="text-[13px] text-[#6e6e6e] mt-1">
            Real-time installation velocity, community engagement signals, package geometry, and release cadence.
          </p>
        </div>

        {/* Period Selector Tabs with tactile micro-interactions */}
        <div className="flex items-center rounded-[12px] border border-[#e8e8e8] bg-[#f8f8f8] p-1 shadow-2xs">
          {['7d', '30d', '90d', '365d'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => changePeriod(p)}
              className={`rounded-[8px] px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.95] active:translate-y-[1px] ${
                currentPeriod === p
                  ? 'bg-[#0033ff] text-white shadow-[0_2px_0_#0026bf]'
                  : 'text-[#6e6e6e] hover:text-[#1a1a1a] hover:bg-white'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Download Velocity KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total in Period */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8c8c8c]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Total in {currentPeriod}</span>
            <TrendingUp className="h-4 w-4 text-[#0033ff]" />
          </div>
          <div className="mt-2 text-[26px] font-mono font-bold text-[#1a1a1a] tabular-nums">
            {loading ? '...' : data?.totalDownloads ? data.totalDownloads.toLocaleString() : '0'}
          </div>
          <span className="text-[11px] text-[#8c8c8c] mt-1">
            {formatNumber(data?.totalDownloads)} cumulative installations
          </span>
        </div>

        {/* Daily Average */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8c8c8c]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Daily Average</span>
            <Activity className="h-4 w-4 text-[#17a45c]" />
          </div>
          <div className="mt-2 text-[26px] font-mono font-bold text-[#1a1a1a] tabular-nums">
            {loading ? '...' : data?.dailyAverage ? data.dailyAverage.toLocaleString() : '0'}
          </div>
          <span className="text-[11px] text-[#8c8c8c] mt-1">
            ~{formatNumber(data?.dailyAverage)} downloads / day
          </span>
        </div>

        {/* Growth Velocity */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8c8c8c]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Velocity Growth</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[26px] font-mono font-bold">
            {loading ? (
              <span className="text-[#8c8c8c]">...</span>
            ) : data?.growthRatePercent !== undefined ? (
              <>
                {data.growthRatePercent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#17a45c]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-[#e5484d]" />
                )}
                <span
                  className={`tabular-nums ${
                    data.growthRatePercent >= 0 ? 'text-[#17a45c]' : 'text-[#e5484d]'
                  }`}
                >
                  {data.growthRatePercent >= 0 ? `+${data.growthRatePercent}%` : `${data.growthRatePercent}%`}
                </span>
              </>
            ) : (
              <span className="text-[#a6a6a6]">—</span>
            )}
          </div>
          <span className="text-[11px] text-[#8c8c8c] mt-1">vs. prior half period</span>
        </div>

        {/* Peak Surge Day */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8c8c8c]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Peak Single Day</span>
            <Gauge className="h-4 w-4 text-[#8c8c8c]" />
          </div>
          <div className="mt-2 text-[26px] font-mono font-bold text-[#1a1a1a] tabular-nums truncate">
            {loading ? '...' : data?.peakDay ? data.peakDay.downloads.toLocaleString() : '—'}
          </div>
          <span className="text-[11px] text-[#8c8c8c] mt-1 truncate">
            {data?.peakDay ? `Peak on ${data.peakDay.date}` : 'Across selected period'}
          </span>
        </div>
      </div>

      {/* Main Animated Download Line Chart */}
      {loading ? (
        <div className="flex h-[320px] w-full items-center justify-center rounded-[20px] border border-[#e8e8e8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col items-center gap-2 text-[#6e6e6e]">
            <Loader2 className="h-6 w-6 animate-spin text-[#0033ff]" />
            <span className="text-[12px]">Retrieving registry download metrics...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[18px] border border-[#ffe2c7] bg-[#fff4e8] p-5 text-[#bf5b00]">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="h-4 w-4" />
            Unable to fetch analytics
          </div>
          <p className="text-[14px]">{error}</p>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-3">
          <DownloadChart data={data.history} />
          <div className="text-[11px] text-[#8c8c8c] flex items-center justify-between px-2">
            <span>
              <strong>Methodology:</strong> Downloads reflect registry client GET requests and CI/CD runs. Source: <strong>{data.source}</strong>.
            </span>
            <span className="font-mono">
              Estimated Run-Rate: ~{formatNumber(data.annualizedRunRate)}/yr
            </span>
          </div>
        </div>
      ) : null}

      {/* Velocity Run-Rates Sub-Panel */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-[#e8e8e8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <span className="text-[11.5px] font-semibold text-[#8c8c8c] uppercase tracking-wider block">
              30-Day Run Rate
            </span>
            <div className="mt-1 font-mono text-[20px] font-bold text-[#1a1a1a]">
              ~{formatNumber(data.estimatedMonthly || data.dailyAverage * 30)}
            </div>
            <span className="text-[11px] text-[#6e6e6e]">Estimated monthly installs</span>
          </div>

          <div className="p-4 bg-white border border-[#e8e8e8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <span className="text-[11.5px] font-semibold text-[#8c8c8c] uppercase tracking-wider block">
              Annualized Velocity
            </span>
            <div className="mt-1 font-mono text-[20px] font-bold text-[#1a1a1a]">
              ~{formatNumber(data.annualizedRunRate || data.dailyAverage * 365)}
            </div>
            <span className="text-[11px] text-[#6e6e6e]">Annualized install volume</span>
          </div>

          <div className="p-4 bg-white border border-[#e8e8e8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <span className="text-[11.5px] font-semibold text-[#8c8c8c] uppercase tracking-wider block">
              Adoption Momentum
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-[18px]">
              {(data.growthRatePercent || 0) > 10 ? (
                <>
                  <Sparkles className="h-4 w-4 text-[#17a45c]" />
                  <span className="text-[#17a45c]">Accelerating</span>
                </>
              ) : (data.growthRatePercent || 0) >= -10 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#0033ff]" />
                  <span className="text-[#0033ff]">Steady / Mature</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">Softening</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-[#6e6e6e]">Based on rolling trend variance</span>
          </div>
        </div>
      )}

      {/* Community, Repository & Ecosystem Signals */}
      {pkg && (
        <div className="bg-white border border-[#e8e8e8] rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#1a1a1a]">
                Community Signals & Repository Health
              </h3>
              <p className="text-[12px] text-[#6e6e6e] mt-0.5">
                Stargazers, pull request activity, issue resolution velocity, and supply chain footprint.
              </p>
            </div>
            {pkg.repository && (
              <a
                href={pkg.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold text-[#0033ff] hover:underline"
              >
                View Repository →
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Stars */}
            <div className="p-3.5 bg-[#fbfbfb] border border-[#f0f0f0] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#8c8c8c] text-[11px] font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>GitHub Stars</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#1a1a1a]">
                {formatNumber(pkg.starsCount)}
              </div>
              <span className="text-[10px] text-[#8c8c8c]">Stargazers</span>
            </div>

            {/* Forks */}
            <div className="p-3.5 bg-[#fbfbfb] border border-[#f0f0f0] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#8c8c8c] text-[11px] font-medium">
                <GitFork className="h-3.5 w-3.5 text-[#0033ff]" />
                <span>Forks</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#1a1a1a]">
                {formatNumber(pkg.forksCount)}
              </div>
              <span className="text-[10px] text-[#8c8c8c]">Network forks</span>
            </div>

            {/* Open Issues */}
            <div className="p-3.5 bg-[#fbfbfb] border border-[#f0f0f0] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#8c8c8c] text-[11px] font-medium">
                <AlertCircle className="h-3.5 w-3.5 text-[#e5484d]" />
                <span>Open Issues</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#1a1a1a]">
                {formatNumber(pkg.openIssuesCount)}
              </div>
              <span className="text-[10px] text-[#8c8c8c]">Unresolved issues</span>
            </div>

            {/* Watchers */}
            <div className="p-3.5 bg-[#fbfbfb] border border-[#f0f0f0] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#8c8c8c] text-[11px] font-medium">
                <Eye className="h-3.5 w-3.5 text-[#6e6e6e]" />
                <span>Watchers</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#1a1a1a]">
                {formatNumber(pkg.watchersCount)}
              </div>
              <span className="text-[10px] text-[#8c8c8c]">Subscribers</span>
            </div>

            {/* Direct Dependencies */}
            <div className="p-3.5 bg-[#fbfbfb] border border-[#f0f0f0] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#8c8c8c] text-[11px] font-medium">
                <Layers className="h-3.5 w-3.5 text-[#0033ff]" />
                <span>Direct Deps</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#1a1a1a]">
                {pkg.dependenciesCount !== undefined ? pkg.dependenciesCount : '—'}
              </div>
              <span className="text-[10px] text-[#8c8c8c]">Declared imports</span>
            </div>

            {/* License Suitability */}
            <div className="p-3.5 bg-[#fbfbfb] border border-[#f0f0f0] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#8c8c8c] text-[11px] font-medium">
                <Scale className="h-3.5 w-3.5 text-[#17a45c]" />
                <span>License</span>
              </div>
              <div className="mt-1.5 font-mono text-[15px] font-bold text-[#1a1a1a] truncate" title={pkg.license}>
                {pkg.license}
              </div>
              <span className="text-[10px] text-[#17a45c] font-semibold">
                {pkg.license.toLowerCase().includes('gpl') ? 'Copyleft' : 'Permissive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Package Geometry & Footprint Grid */}
      {pkg && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Unpacked Size */}
          <div className="p-5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 text-[#8c8c8c] text-[12px] font-semibold">
              <HardDrive className="h-4 w-4 text-[#0033ff]" />
              <span>UNPACKED SIZE</span>
            </div>
            <div className="mt-2 font-mono text-[22px] font-bold text-[#1a1a1a]">
              {formatBytes(pkg.unpackedSize)}
            </div>
            <span className="text-[11px] text-[#6e6e6e] mt-1 block">
              Disk footprint when extracted
            </span>
          </div>

          {/* Type Safety */}
          <div className="p-5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 text-[#8c8c8c] text-[12px] font-semibold">
              <FileCode className="h-4 w-4 text-[#17a45c]" />
              <span>TYPE DEFINITIONS</span>
            </div>
            <div className="mt-2 text-[18px] font-bold text-[#1a1a1a]">
              {pkg.hasTypeDefinitions ? (
                <span className="text-[#0033ff]">{pkg.typeDefinitionsType || 'Included'}</span>
              ) : (
                <span className="text-[#8c8c8c]">Untyped</span>
              )}
            </div>
            <span className="text-[11px] text-[#6e6e6e] mt-1 block">
              {pkg.hasTypeDefinitions ? 'Native IDE autocomplete' : 'No type annotations found'}
            </span>
          </div>

          {/* Release Cadence */}
          <div className="p-5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 text-[#8c8c8c] text-[12px] font-semibold">
              <Clock className="h-4 w-4 text-[#8c8c8c]" />
              <span>RELEASE CADENCE</span>
            </div>
            <div className="mt-2 font-mono text-[22px] font-bold text-[#1a1a1a]">
              {pkg.totalReleases !== undefined ? `${pkg.totalReleases} releases` : '—'}
            </div>
            <span className="text-[11px] text-[#6e6e6e] mt-1 block">
              Total lifetime published versions
            </span>
          </div>

          {/* Runtime Compatibility */}
          <div className="p-5 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 text-[#8c8c8c] text-[12px] font-semibold">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>RUNTIME COMPATIBILITY</span>
            </div>
            <div className="mt-2 font-mono text-[16px] font-bold text-[#1a1a1a] truncate">
              {pkg.requiresRuntime || (pkg.ecosystem === 'npm' ? 'Node.js universal' : 'Python 3.x universal')}
            </div>
            <span className="text-[11px] text-[#6e6e6e] mt-1 block">
              Required host runtime environment
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
