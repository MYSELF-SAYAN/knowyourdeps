'use client';

import React, { useState, useEffect } from 'react';
import { PackageOverview } from '@/lib/types';
import { Badge } from './ui/Badge';
import {
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Terminal,
  Shuffle,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

interface PackageSidebarProps {
  pkg: PackageOverview;
  activeVersion?: string;
  onOpenCompare?: () => void;
}

interface VersionSecurityState {
  loading: boolean;
  count: number | null;
  status: 'safe' | 'vulnerable' | 'unavailable' | 'unknown';
}

export function PackageSidebar({ pkg, activeVersion, onOpenCompare }: PackageSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  const effectiveVersion =
    activeVersion && activeVersion !== 'latest' ? activeVersion : pkg.latestVersion;
  const isLatestVersion =
    !activeVersion || activeVersion === 'latest' || activeVersion === pkg.latestVersion;

  const currentInstallCommand = isLatestVersion
    ? pkg.installCommand
    : pkg.ecosystem === 'npm'
    ? `npm i ${pkg.name}@${effectiveVersion}`
    : `pip install ${pkg.name}==${effectiveVersion}`;

  const [secState, setSecState] = useState<VersionSecurityState>({
    loading: false,
    count: isLatestVersion ? pkg.vulnerabilitiesCount : null,
    status: isLatestVersion ? pkg.securityStatus : 'unknown',
  });

  // Keep security status synchronized with the currently selected version
  useEffect(() => {
    if (isLatestVersion && pkg.securityStatus) {
      setSecState({
        loading: false,
        count: pkg.vulnerabilitiesCount,
        status: pkg.securityStatus,
      });
      return;
    }

    let isMounted = true;
    setSecState((prev) => ({ ...prev, loading: true }));

    fetch(
      `/api/package/security?ecosystem=${pkg.ecosystem}&name=${encodeURIComponent(
        pkg.name
      )}&version=${encodeURIComponent(effectiveVersion)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const count = data.vulnerabilities?.length || 0;
        setSecState({
          loading: false,
          count,
          status: count > 0 ? 'vulnerable' : 'safe',
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setSecState({
          loading: false,
          count: null,
          status: 'unknown',
        });
      });

    return () => {
      isMounted = false;
    };
  }, [
    pkg.ecosystem,
    pkg.name,
    effectiveVersion,
    isLatestVersion,
    pkg.securityStatus,
    pkg.vulnerabilitiesCount,
  ]);

  const copyCommand = () => {
    navigator.clipboard.writeText(currentInstallCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const registryUrl =
    pkg.ecosystem === 'npm'
      ? `https://www.npmjs.com/package/${pkg.name}`
      : `https://pypi.org/project/${pkg.name}/`;

  return (
    <aside className="w-full">
      {/* Mobile Compact Header Bar (< lg) - Prevents layout pushdown */}
      <div className="lg:hidden bg-white border border-[#e8e8e8] rounded-[16px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-[18px] font-bold text-[#1a1a1a] truncate">
              {pkg.name}
            </h1>
            <Badge variant={isLatestVersion ? 'neutral' : 'warning'} size="sm">
              v{effectiveVersion}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={copyCommand}
              aria-label="Copy install command"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#f6f6f6] border border-[#e8e8e8] text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#eff6ff] hover:text-[#1d53c6] hover:border-[#bfdbfe] transition-all cursor-pointer min-h-[32px] active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#0d7a42]" />
                  <span className="text-[#0d7a42]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-[#555a64]" />
                  <span>Install</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileDetailsOpen(!isMobileDetailsOpen)}
              aria-expanded={isMobileDetailsOpen}
              aria-label="Toggle package metadata details"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-white border border-[#e8e8e8] text-[11px] font-semibold text-[#555a64] hover:text-[#1a1a1a] hover:bg-[#f8f8f8] transition-all cursor-pointer min-h-[32px]"
            >
              <span>Info</span>
              {isMobileDetailsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Security Summary Row on Mobile */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#f0f0f0]">
          {secState.loading ? (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#555a64]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1d53c6]" />
              <span>Auditing security for v{effectiveVersion}...</span>
            </div>
          ) : secState.status === 'safe' ? (
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0d7a42]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>0 CVEs in v{effectiveVersion}</span>
            </div>
          ) : secState.status === 'vulnerable' ? (
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#b82429]">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>
                {secState.count} known CVE{secState.count !== 1 ? 's' : ''} in v{effectiveVersion}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#555a64]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Audited in OSV / deps.dev</span>
            </div>
          )}

          {onOpenCompare && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="text-[11.5px] text-[#1d53c6] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Shuffle className="h-3 w-3" /> Compare
            </button>
          )}
        </div>

        {/* Expandable Info Drawer for Mobile */}
        {isMobileDetailsOpen && (
          <div className="pt-2 border-t border-[#f0f0f0] flex flex-col gap-3 animate-in fade-in duration-200">
            <p className="text-[12.5px] text-[#555a64] leading-relaxed">
              {pkg.description || 'No description provided.'}
            </p>

            <div className="rounded-[10px] bg-[#f6f6f6] border border-[#e8e8e8] px-2.5 py-1.5 font-mono text-[11px] text-[#1a1a1a] flex items-center gap-1.5">
              <span className="text-[#a6a6a6] select-none">$</span>
              <span className="truncate">{currentInstallCommand}</span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              {pkg.repository && (
                <a
                  href={pkg.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#f8f8f8] hover:bg-[#eff6ff] border border-[#e8e8e8] text-[#1a1a1a] hover:text-[#1d53c6] transition-colors"
                >
                  <Code2 className="h-3 w-3" /> GitHub <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {pkg.homepage && (
                <a
                  href={pkg.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#f8f8f8] hover:bg-[#eff6ff] border border-[#e8e8e8] text-[#1a1a1a] hover:text-[#1d53c6] transition-colors"
                >
                  <Terminal className="h-3 w-3" /> Homepage <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              <a
                href={registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#f8f8f8] hover:bg-[#eff6ff] border border-[#e8e8e8] text-[#1a1a1a] hover:text-[#1d53c6] transition-colors"
              >
                <Layers className="h-3 w-3" /> {pkg.ecosystem === 'npm' ? 'npm' : 'PyPI'}{' '}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Persistent Sidebar (>= lg) */}
      <div className="hidden lg:flex flex-col gap-3.5 bg-white border border-[#e8e8e8] rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="accent" size="sm">
            {pkg.ecosystem.toUpperCase()}
          </Badge>
          <Badge variant={isLatestVersion ? 'neutral' : 'warning'} size="sm">
            v{effectiveVersion} {!isLatestVersion && '(selected)'}
          </Badge>
          <Badge variant="neutral" size="sm">
            {pkg.license}
          </Badge>
          {pkg.isDeprecated && (
            <Badge variant="warning" size="sm">
              DEPRECATED
            </Badge>
          )}
        </div>

        {/* Package Name & Description */}
        <div>
          <h1 className="font-display text-[24px] leading-[1.1] font-bold tracking-tight text-[#1a1a1a] break-words">
            {pkg.name}
          </h1>
          <p className="mt-2 text-[13px] text-[#555a64] leading-relaxed line-clamp-4">
            {pkg.description}
          </p>
        </div>

        {/* Synchronized Security Pill */}
        <div className="pt-2 border-t border-[#f0f0f0]">
          {secState.loading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#f8fafc] text-[#64748b] text-[12px] font-medium border border-[#e2e8f0]">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1d53c6]" />
              <span>Auditing v{effectiveVersion}...</span>
            </div>
          ) : secState.status === 'safe' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#eefcf3] text-[#0d7a42] text-[12px] font-semibold border border-[#c7f3d6]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>0 known CVEs in v{effectiveVersion}</span>
            </div>
          ) : secState.status === 'vulnerable' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#feecee] text-[#b82429] text-[12px] font-semibold border border-[#fcccd1]">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                {secState.count} known CVE{secState.count !== 1 ? 's' : ''} in v{effectiveVersion}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#f8fafc] text-[#64748b] text-[12px] font-medium border border-[#e2e8f0]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Security audited in OSV / deps.dev</span>
            </div>
          )}
        </div>

        {/* Copyable Install Box */}
        <div className="rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] p-2.5 flex items-center justify-between gap-2 font-mono text-[12px]">
          <div className="flex items-center gap-1.5 truncate text-[#0f172a]">
            <span className="text-[#94a3b8] select-none">$</span>
            <span className="truncate select-all">{currentInstallCommand}</span>
          </div>
          <button
            type="button"
            onClick={copyCommand}
            aria-label="Copy install command"
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white border border-[#e2e8f0] text-[11px] font-semibold text-[#0f172a] hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d53c6] transition-all cursor-pointer shadow-2xs active:scale-95 min-h-[30px]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#0d7a42]" />
                <span className="text-[#0d7a42]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-[#64748b]" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Outbound Resource Links */}
        <div className="flex flex-col gap-1 pt-2 border-t border-[#f0f0f0] text-[12px]">
          {pkg.repository && (
            <a
              href={pkg.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-[#eff6ff] text-[#0f172a] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-[#64748b] group-hover:text-[#1d53c6]" />
                <span className="font-medium">GitHub Repository</span>
              </div>
              <ExternalLink className="h-3 w-3 text-[#64748b] group-hover:text-[#1d53c6]" />
            </a>
          )}

          {pkg.homepage && (
            <a
              href={pkg.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-[#eff6ff] text-[#0f172a] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[#64748b] group-hover:text-[#1d53c6]" />
                <span className="font-medium">Homepage</span>
              </div>
              <ExternalLink className="h-3 w-3 text-[#64748b] group-hover:text-[#1d53c6]" />
            </a>
          )}

          <a
            href={registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-[#eff6ff] text-[#0f172a] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#64748b] group-hover:text-[#1d53c6]" />
              <span className="font-medium">
                {pkg.ecosystem === 'npm' ? 'npmjs.com' : 'pypi.org'}
              </span>
            </div>
            <ExternalLink className="h-3 w-3 text-[#64748b] group-hover:text-[#1d53c6]" />
          </a>
        </div>

        {/* Maintainers */}
        {pkg.maintainers && pkg.maintainers.length > 0 && (
          <div className="pt-2 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1.5 text-[#64748b] font-medium text-[11px] mb-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Maintainers</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pkg.maintainers.slice(0, 4).map((m, i) => (
                <span
                  key={i}
                  className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-[#f8fafc] text-[#334155] border border-[#e2e8f0]"
                >
                  @{m}
                </span>
              ))}
              {pkg.maintainers.length > 4 && (
                <span className="text-[10px] text-[#64748b] self-center">
                  +{pkg.maintainers.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Compare Action Button */}
        {onOpenCompare && (
          <div className="pt-2 border-t border-[#f0f0f0]">
            <button
              type="button"
              onClick={onOpenCompare}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#f8fafc] hover:bg-[#eff6ff] border border-[#e2e8f0] hover:border-[#bfdbfe] text-[12px] font-semibold text-[#0f172a] hover:text-[#1d53c6] transition-all cursor-pointer active:scale-95 min-h-[36px]"
            >
              <Shuffle className="h-3.5 w-3.5 text-[#1d53c6]" />
              <span>Compare against package</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}