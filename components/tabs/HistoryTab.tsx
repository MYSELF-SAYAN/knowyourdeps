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
  const currentPeriod = searchParams.get('period') || '365d';

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
      {/* Header Bar: Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#dce7f5] p-5 rounded-[20px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#0f172a]">Package Telemetry & Deep Metrics</h2>
            <Badge variant="accent" size="sm">
              {ecosystem.toUpperCase()}
            </Badge>
          </div>
          <p className="text-[13px] text-[#475569] mt-1">
            Real-time installation velocity, community engagement signals, package geometry, and release cadence.
          </p>
        </div>
      </div>

      {/* 4 Download Velocity KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total in Period */}
        <div className="min-w-0 p-4.5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Total Annual Velocity</span>
            <TrendingUp className="h-4 w-4 text-[#0558d6] shrink-0" aria-hidden="true" />
          </div>
          {loading ? (
            <div className="my-2 h-7 w-28 bg-[#e8eef7] rounded-[6px] animate-pulse" />
          ) : (
            <div className="mt-2 text-[20px] xl:text-[22px] font-display font-bold text-[#0f172a] tracking-tight tabular-nums truncate">
              {data?.totalDownloads ? data.totalDownloads.toLocaleString() : '0'}
            </div>
          )}
          <span className="text-[11px] text-[#475569] mt-1">
            {loading ? '…' : `${formatNumber(data?.totalDownloads)} cumulative installations`}
          </span>
        </div>

        {/* Daily Average */}
        <div className="min-w-0 p-4.5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Daily Average</span>
            <Activity className="h-4 w-4 text-[#17a45c] shrink-0" aria-hidden="true" />
          </div>
          {loading ? (
            <div className="my-2 h-7 w-24 bg-[#e8eef7] rounded-[6px] animate-pulse" />
          ) : (
            <div className="mt-2 text-[20px] xl:text-[22px] font-display font-bold text-[#0f172a] tracking-tight tabular-nums truncate">
              {data?.dailyAverage ? data.dailyAverage.toLocaleString() : '0'}
            </div>
          )}
          <span className="text-[11px] text-[#475569] mt-1">
            {loading ? '…' : `~${formatNumber(data?.dailyAverage)} downloads / day`}
          </span>
        </div>

        {/* Growth Velocity */}
        <div className="min-w-0 p-4.5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Velocity Growth</span>
            <Zap className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
          </div>
          {loading ? (
            <div className="my-2 h-7 w-20 bg-[#e8eef7] rounded-[6px] animate-pulse" />
          ) : (
            <div className="mt-2 flex items-center gap-1.5 text-[20px] xl:text-[22px] font-display font-bold">
              {data?.growthRatePercent !== undefined ? (
                <>
                  {data.growthRatePercent >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-[#17a45c] shrink-0" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[#e5484d] shrink-0" aria-hidden="true" />
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
                <span className="text-[#64748b]">—</span>
              )}
            </div>
          )}
          <span className="text-[11px] text-[#475569] mt-1">vs. prior half period</span>
        </div>

        {/* Peak Surge Day */}
        <div className="min-w-0 p-4.5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Peak Single Day</span>
            <Gauge className="h-4 w-4 text-[#475569] shrink-0" aria-hidden="true" />
          </div>
          {loading ? (
            <div className="my-2 h-7 w-28 bg-[#e8eef7] rounded-[6px] animate-pulse" />
          ) : (
            <div className="mt-2 text-[20px] xl:text-[22px] font-display font-bold text-[#0f172a] tracking-tight tabular-nums truncate">
              {data?.peakDay ? data.peakDay.downloads.toLocaleString() : '—'}
            </div>
          )}
          <span className="text-[11px] text-[#475569] mt-1 truncate">
            {loading ? '…' : data?.peakDay ? `Peak on ${data.peakDay.date}` : 'Across selected period'}
          </span>
        </div>
      </div>

      {/* Main Download Line Chart with High-Fidelity Skeleton */}
      {loading ? (
        <div className="flex flex-col justify-between h-[300px] w-full rounded-[20px] border border-[#dce7f5] bg-white p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
          <div className="flex items-center justify-between border-b border-[#e8eef7] pb-4">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-[#e8eef7] rounded animate-pulse" />
              <div className="h-8 w-36 bg-[#e8eef7] rounded-[8px] animate-pulse" />
            </div>
            <div className="h-6 w-28 bg-[#e8eef7] rounded animate-pulse" />
          </div>
          {/* Faux grid lines */}
          <div className="space-y-8 py-4">
            <div className="h-px w-full bg-[#f1f6fd]" />
            <div className="h-px w-full bg-[#f1f6fd]" />
            <div className="h-px w-full bg-[#f1f6fd]" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#e8eef7]">
            <div className="h-3 w-16 bg-[#e8eef7] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#e8eef7] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#e8eef7] rounded animate-pulse" />
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
          <div className="text-[11px] text-[#475569] flex items-center justify-between px-2">
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
          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <span className="text-[11.5px] font-semibold text-[#475569] uppercase tracking-wider block">
              30-Day Run Rate
            </span>
            <div className="mt-1 font-mono text-[20px] font-bold text-[#0f172a]">
              ~{formatNumber(data.estimatedMonthly || data.dailyAverage * 30)}
            </div>
            <span className="text-[11px] text-[#475569]">Estimated monthly installs</span>
          </div>

          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <span className="text-[11.5px] font-semibold text-[#475569] uppercase tracking-wider block">
              Annualized Velocity
            </span>
            <div className="mt-1 font-mono text-[20px] font-bold text-[#0f172a]">
              ~{formatNumber(data.annualizedRunRate || data.dailyAverage * 365)}
            </div>
            <span className="text-[11px] text-[#475569]">Annualized install volume</span>
          </div>

          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <span className="text-[11.5px] font-semibold text-[#475569] uppercase tracking-wider block">
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
                  <CheckCircle2 className="h-4 w-4 text-[#0558d6]" />
                  <span className="text-[#0558d6]">Steady / Mature</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">Softening</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-[#475569]">Based on rolling trend variance</span>
          </div>
        </div>
      )}

      {/* Community, Repository & Ecosystem Signals */}
      {pkg && (
        <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#e8eef7] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#0f172a]">
                Community Signals & Repository Health
              </h3>
              <p className="text-[12px] text-[#475569] mt-0.5">
                Stargazers, pull request activity, issue resolution velocity, and supply chain footprint.
              </p>
            </div>
            {pkg.repository && (
              <a
                href={pkg.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold text-[#0558d6] hover:underline"
              >
                View Repository →
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Stars */}
            <div className="p-3.5 bg-[#f8fbff] border border-[#e8eef7] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#475569] text-[11px] font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>GitHub Stars</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#0f172a]">
                {formatNumber(pkg.starsCount)}
              </div>
              <span className="text-[10px] text-[#475569]">Stargazers</span>
            </div>

            {/* Forks */}
            <div className="p-3.5 bg-[#f8fbff] border border-[#e8eef7] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#475569] text-[11px] font-medium">
                <GitFork className="h-3.5 w-3.5 text-[#0558d6]" />
                <span>Forks</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#0f172a]">
                {formatNumber(pkg.forksCount)}
              </div>
              <span className="text-[10px] text-[#475569]">Network forks</span>
            </div>

            {/* Open Issues */}
            <div className="p-3.5 bg-[#f8fbff] border border-[#e8eef7] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#475569] text-[11px] font-medium">
                <AlertCircle className="h-3.5 w-3.5 text-[#e5484d]" />
                <span>Open Issues</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#0f172a]">
                {formatNumber(pkg.openIssuesCount)}
              </div>
              <span className="text-[10px] text-[#475569]">Unresolved issues</span>
            </div>

            {/* Watchers */}
            <div className="p-3.5 bg-[#f8fbff] border border-[#e8eef7] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#475569] text-[11px] font-medium">
                <Eye className="h-3.5 w-3.5 text-[#475569]" />
                <span>Watchers</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#0f172a]">
                {formatNumber(pkg.watchersCount)}
              </div>
              <span className="text-[10px] text-[#475569]">Subscribers</span>
            </div>

            {/* Direct Dependencies */}
            <div className="p-3.5 bg-[#f8fbff] border border-[#e8eef7] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#475569] text-[11px] font-medium">
                <Layers className="h-3.5 w-3.5 text-[#0558d6]" />
                <span>Direct Deps</span>
              </div>
              <div className="mt-1.5 font-mono text-[18px] font-bold text-[#0f172a]">
                {pkg.dependenciesCount !== undefined ? pkg.dependenciesCount : '—'}
              </div>
              <span className="text-[10px] text-[#475569]">Declared imports</span>
            </div>

            {/* License Suitability */}
            <div className="p-3.5 bg-[#f8fbff] border border-[#e8eef7] rounded-[14px]">
              <div className="flex items-center gap-1 text-[#475569] text-[11px] font-medium">
                <Scale className="h-3.5 w-3.5 text-[#17a45c]" />
                <span>License</span>
              </div>
              <div className="mt-1.5 font-mono text-[15px] font-bold text-[#0f172a] truncate" title={pkg.license}>
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
          <div className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center gap-2 text-[#475569] text-[12px] font-semibold">
              <HardDrive className="h-4 w-4 text-[#0558d6]" />
              <span>UNPACKED SIZE</span>
            </div>
            <div className="mt-2 font-mono text-[22px] font-bold text-[#0f172a]">
              {formatBytes(pkg.unpackedSize)}
            </div>
            <span className="text-[11px] text-[#475569] mt-1 block">
              Disk footprint when extracted
            </span>
          </div>

          {/* Type Safety */}
          <div className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center gap-2 text-[#475569] text-[12px] font-semibold">
              <FileCode className="h-4 w-4 text-[#17a45c]" />
              <span>TYPE DEFINITIONS</span>
            </div>
            <div className="mt-2 text-[18px] font-bold text-[#0f172a]">
              {pkg.hasTypeDefinitions ? (
                <span className="text-[#0558d6]">{pkg.typeDefinitionsType || 'Included'}</span>
              ) : (
                <span className="text-[#475569]">Untyped</span>
              )}
            </div>
            <span className="text-[11px] text-[#475569] mt-1 block">
              {pkg.hasTypeDefinitions ? 'Native IDE autocomplete' : 'No type annotations found'}
            </span>
          </div>

          {/* Release Cadence */}
          <div className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center gap-2 text-[#475569] text-[12px] font-semibold">
              <Clock className="h-4 w-4 text-[#475569]" />
              <span>RELEASE CADENCE</span>
            </div>
            <div className="mt-2 font-mono text-[22px] font-bold text-[#0f172a]">
              {pkg.totalReleases !== undefined ? `${pkg.totalReleases} releases` : '—'}
            </div>
            <span className="text-[11px] text-[#475569] mt-1 block">
              Total lifetime published versions
            </span>
          </div>

          {/* Runtime Compatibility */}
          <div className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center gap-2 text-[#475569] text-[12px] font-semibold">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>RUNTIME COMPATIBILITY</span>
            </div>
            <div className="mt-2 font-mono text-[16px] font-bold text-[#0f172a] truncate">
              {pkg.requiresRuntime || (pkg.ecosystem === 'npm' ? 'Node.js universal' : 'Python 3.x universal')}
            </div>
            <span className="text-[11px] text-[#475569] mt-1 block">
              Required host runtime environment
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
