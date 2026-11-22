'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface PackageSidebarProps {
  pkg: PackageOverview;
  onOpenCompare?: () => void;
}

export function PackageSidebar({ pkg, onOpenCompare }: PackageSidebarProps) {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText(pkg.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const registryUrl =
    pkg.ecosystem === 'npm'
      ? `https://www.npmjs.com/package/${pkg.name}`
      : `https://pypi.org/project/${pkg.name}/`;

  return (
    <aside className="w-full flex flex-col gap-3.5">
      {/* Primary Card: Package Identity & Quick Actions */}
      <div className="bg-white border border-[#e8e8e8] rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-3.5">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="accent" size="sm">
            {pkg.ecosystem.toUpperCase()}
          </Badge>
          <Badge variant="neutral" size="sm">
            v{pkg.latestVersion}
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
          <p className="mt-2 text-[13px] text-[#6e6e6e] leading-relaxed line-clamp-4">
            {pkg.description}
          </p>
        </div>

        {/* Security Pill */}
        <div className="pt-2 border-t border-[#f0f0f0]">
          {pkg.securityStatus === 'safe' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#eefcf3] text-[#17a45c] text-[12px] font-semibold border border-[#c7f3d6]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>No known CVEs in package</span>
            </div>
          ) : pkg.securityStatus === 'vulnerable' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#feecee] text-[#e5484d] text-[12px] font-semibold border border-[#fcccd1]">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{pkg.vulnerabilitiesCount} known security advisories</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#f8f8f8] text-[#8c8c8c] text-[12px] font-medium border border-[#e8e8e8]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Security audited in OSV / deps.dev</span>
            </div>
          )}
        </div>

        {/* Copyable Install Box */}
        <div className="rounded-[12px] bg-[#f6f6f6] border border-[#e8e8e8] p-2.5 flex items-center justify-between gap-2 font-mono text-[12px]">
          <div className="flex items-center gap-1.5 truncate text-[#1a1a1a]">
            <span className="text-[#a6a6a6] select-none">$</span>
            <span className="truncate select-all">{pkg.installCommand}</span>
          </div>
          <button
            type="button"
            onClick={copyCommand}
            aria-label="Copy install command"
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-[6px] bg-white border border-[#e8e8e8] text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#ebefff] hover:border-[#c7d3ff] hover:text-[#0033ff] transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#17a45c]" />
                <span className="text-[#17a45c]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-[#8c8c8c]" />
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
              className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-[#f8f8f8] text-[#1a1a1a] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-[#8c8c8c] group-hover:text-[#0033ff]" />
                <span className="font-medium">GitHub Repository</span>
              </div>
              <ExternalLink className="h-3 w-3 text-[#8c8c8c] group-hover:text-[#0033ff]" />
            </a>
          )}

          {pkg.homepage && (
            <a
              href={pkg.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-[#f8f8f8] text-[#1a1a1a] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[#8c8c8c] group-hover:text-[#0033ff]" />
                <span className="font-medium">Homepage</span>
              </div>
              <ExternalLink className="h-3 w-3 text-[#8c8c8c] group-hover:text-[#0033ff]" />
            </a>
          )}

          <a
            href={registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-[#f8f8f8] text-[#1a1a1a] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#8c8c8c] group-hover:text-[#0033ff]" />
              <span className="font-medium">{pkg.ecosystem === 'npm' ? 'npmjs.com' : 'pypi.org'}</span>
            </div>
            <ExternalLink className="h-3 w-3 text-[#8c8c8c] group-hover:text-[#0033ff]" />
          </a>
        </div>

        {/* Maintainers */}
        {pkg.maintainers && pkg.maintainers.length > 0 && (
          <div className="pt-2 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1.5 text-[#8c8c8c] font-medium text-[11px] mb-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Maintainers</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pkg.maintainers.slice(0, 4).map((m, i) => (
                <span
                  key={i}
                  className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-[#f4f4f4] text-[#4a4a4a] border border-[#e8e8e8]"
                >
                  @{m}
                </span>
              ))}
              {pkg.maintainers.length > 4 && (
                <span className="text-[10px] text-[#8c8c8c] self-center">
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
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#f8f8f8] hover:bg-[#efefef] border border-[#e8e8e8] text-[12px] font-semibold text-[#1a1a1a] transition-all cursor-pointer active:scale-95"
            >
              <Shuffle className="h-3.5 w-3.5 text-[#0033ff]" />
              <span>Compare against package</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
