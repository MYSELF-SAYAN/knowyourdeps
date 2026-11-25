'use client';

import React, { useEffect, useState } from 'react';
import { Ecosystem, RepositoryHealth } from '@/lib/types';
import { Activity, Star, GitFork, AlertCircle, Calendar, Shield, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { KeycapButton } from '../ui/KeycapButton';

function GithubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

interface HealthTabProps {
  ecosystem: Ecosystem;
  packageName: string;
}

export function HealthTab({ ecosystem, packageName }: HealthTabProps) {
  const [health, setHealth] = useState<RepositoryHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/package/health?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}`
      );
      if (!res.ok) throw new Error('Failed to load package repository health');
      const json = await res.json();
      setHealth(json.health || json);
    } catch (err: any) {
      setError(err.message || 'Error loading repository health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [ecosystem, packageName]);

  const getScorecardColor = (score?: number) => {
    if (score === undefined || score === 0) return 'text-[#475569]';
    if (score >= 7.5) return 'text-[#17a45c]';
    if (score >= 5.0) return 'text-[#f76808]';
    return 'text-[#e5484d]';
  };

  const getScorecardBg = (score?: number) => {
    if (score === undefined || score === 0) return 'bg-[#f1f6fd]';
    if (score >= 7.5) return 'bg-[#eefcf3] border-[#bcf2ce]';
    if (score >= 5.0) return 'bg-[#fff8eb] border-[#fed59b]';
    return 'bg-[#feecee] border-[#fcccd1]';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner with OpenSSF Scorecard & Repo link */}
      <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-14 h-14 rounded-[16px] bg-[#e8eef7] animate-pulse" />
            ) : (
              <div
                className={`w-14 h-14 rounded-[16px] border flex flex-col items-center justify-center ${getScorecardBg(
                  health?.scorecardScore
                )}`}
              >
                <span
                  className={`font-display text-[22px] font-bold ${getScorecardColor(
                    health?.scorecardScore
                  )} tabular-nums`}
                >
                  {health?.scorecardScore ? health.scorecardScore.toFixed(1) : 'N/A'}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#475569]">
                  / 10
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-[18px] text-[#0f172a]">
                  Repository Health & OpenSSF Scorecard
                </h3>
                {!loading && health?.scorecardScore && health.scorecardScore >= 7.5 ? (
                  <Badge variant="success">Healthy</Badge>
                ) : !loading ? (
                  <Badge variant="default">Evaluated</Badge>
                ) : (
                  <Badge variant="neutral">Auditing…</Badge>
                )}
              </div>
              <p className="text-[13px] text-[#475569] mt-1">
                Automated security scorecard, commit cadence, and community governance metrics.
              </p>
            </div>
          </div>

          {health?.repoUrl && (
            <a
              href={health.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#070b14] text-white hover:bg-[#111827] rounded-[10px] text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
            >
              <GithubIcon className="h-4 w-4" aria-hidden="true" />
              <span>View Source Repo</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-[#e8eef7] rounded" />
                  <div className="h-4 w-4 bg-[#e8eef7] rounded-full" />
                </div>
                <div className="h-7 w-20 bg-[#e8eef7] rounded-[6px]" />
                <div className="h-2.5 w-24 bg-[#e8eef7] rounded" />
              </div>
            ))}
          </div>

          {/* Checks checklist shimmer */}
          <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] space-y-4 animate-pulse">
            <div className="h-5 w-48 bg-[#e8eef7] rounded-[6px]" />
            <div className="divide-y divide-[#e8eef7]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#e8eef7]" />
                    <div className="h-4 w-36 bg-[#e8eef7] rounded" />
                  </div>
                  <div className="h-5 w-16 bg-[#e8eef7] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 bg-[#feecee] border border-[#fcccd1] rounded-[16px] text-[#e5484d] flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-[14px]">Unable to load repository health signals</p>
            <p className="text-[12px] opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Vital Metrics Grid */}
      {!loading && health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* GitHub Stars */}
          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">GitHub Stars</span>
              <Star className="h-4 w-4 text-[#e5a000]" />
            </div>
            <div className="mt-2 font-display text-[26px] font-bold text-[#0f172a] tabular-nums">
              {health.stars ? health.stars.toLocaleString() : 'N/A'}
            </div>
          </div>

          {/* Forks */}
          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Forks</span>
              <GitFork className="h-4 w-4 text-[#475569]" />
            </div>
            <div className="mt-2 font-display text-[26px] font-bold text-[#0f172a] tabular-nums">
              {health.forks ? health.forks.toLocaleString() : 'N/A'}
            </div>
          </div>

          {/* Open Issues */}
          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Open Issues</span>
              <AlertCircle className="h-4 w-4 text-[#475569]" />
            </div>
            <div className="mt-2 font-display text-[26px] font-bold text-[#0f172a] tabular-nums">
              {health.openIssues !== undefined ? health.openIssues.toLocaleString() : 'N/A'}
            </div>
          </div>

          {/* Last Push */}
          <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Last Push</span>
              <Calendar className="h-4 w-4 text-[#0558d6]" />
            </div>
            <div className="mt-2 text-[15px] font-bold text-[#0f172a] truncate">
              {health.lastCommitDate
                ? new Date(health.lastCommitDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent'}
            </div>
          </div>
        </div>
      )}

      {/* Signals Breakdown Table */}
      {health && health.signals && health.signals.length > 0 && (
        <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] overflow-hidden shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
          <div className="px-5 py-3.5 border-b border-[#e8eef7] bg-[#f8fbff] flex items-center justify-between text-[12px] font-semibold text-[#475569]">
            <span>Health & Maintenance Signal</span>
            <span>Assessment</span>
          </div>

          <div className="divide-y divide-[#e8eef7]">
            {health.signals.map((sig, idx) => (
              <div
                key={idx}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f8fbff] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {sig.status === 'good' ? (
                    <CheckCircle2 className="h-4 w-4 text-[#17a45c] shrink-0" />
                  ) : sig.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-[#f76808] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-[#475569] shrink-0" />
                  )}
                  <span className="font-sans font-medium text-[13px] text-[#0f172a]">
                    {sig.label}
                  </span>
                </div>

                <Badge
                  variant={sig.status === 'good' ? 'success' : sig.status === 'warning' ? 'warning' : 'default'}
                  size="sm"
                >
                  {String(sig.value)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Repo Notice */}
      {health && !health.repoUrl && (
        <div className="bg-[#f8fbff] border border-[#dce7f5] rounded-[16px] p-6 text-center text-[13px] text-[#475569]">
          No public source repository URL was detected in the package manifest metadata.
        </div>
      )}
    </div>
  );
}
