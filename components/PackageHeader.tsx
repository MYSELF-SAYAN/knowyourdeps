'use client';

import React, { useState } from 'react';
import { PackageOverview } from '@/lib/types';
import { Badge } from './ui/Badge';
import { Copy, Check, ExternalLink, ShieldCheck, ShieldAlert, GitFork, Star, Calendar, User } from 'lucide-react';

interface PackageHeaderProps {
  pkg: PackageOverview;
}

export function PackageHeader({ pkg }: PackageHeaderProps) {
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
    <div className="w-full rounded-[18px] border border-[#e8e8e8] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* Top Metadata Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e8e8e8]">
        <div className="flex flex-wrap items-center gap-2">
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

        {/* Security Status Pill */}
        <div>
          {pkg.securityStatus === 'safe' ? (
            <Badge variant="safe" size="sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>No known CVEs</span>
            </Badge>
          ) : pkg.securityStatus === 'vulnerable' ? (
            <Badge variant="vulnerable" size="sm">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{pkg.vulnerabilitiesCount} known advisories</span>
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Security data unavailable
            </Badge>
          )}
        </div>
      </div>

      {/* Main Headline & Description */}
      <div className="py-5">
        <h1 className="font-display text-[38px] desk:text-[46px] leading-[1.05] tracking-[-0.04em] text-[#1a1a1a] break-words">
          {pkg.name}
        </h1>
        <p className="mt-2.5 max-w-[70ch] text-[15px] desk:text-[16px] leading-relaxed text-[#6e6e6e]">
          {pkg.description}
        </p>
      </div>

      {/* Action Row: Install Command & Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e8e8e8]">
        {/* Click to Copy Install Command Box */}
        <div className="flex items-center rounded-[10px] border border-[#e8e8e8] bg-[#f4f4f4] px-3.5 py-2 font-mono text-[13px] text-[#1a1a1a]">
          <span className="text-[#a6a6a6] mr-2">$</span>
          <span className="font-medium mr-3 select-all">{pkg.installCommand}</span>
          <button
            onClick={copyCommand}
            aria-label="Copy install command"
            className="flex items-center gap-1 rounded-[6px] bg-white border border-[#e8e8e8] px-2 py-1 text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d53c6] transition-all cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#17a45c]" />
                <span className="text-[#17a45c]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* External Link Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {pkg.repository && (
            <a
              href={pkg.repository}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e8e8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1a] hover:bg-[#f4f4f4] transition-colors"
            >
              <span>Repository</span>
              <ExternalLink className="h-3 w-3 text-[#6e6e6e]" />
            </a>
          )}
          {pkg.homepage && (
            <a
              href={pkg.homepage}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e8e8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1a] hover:bg-[#f4f4f4] transition-colors"
            >
              <span>Homepage</span>
              <ExternalLink className="h-3 w-3 text-[#6e6e6e]" />
            </a>
          )}
          <a
            href={registryUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e8e8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1a] hover:bg-[#f4f4f4] transition-colors"
          >
            <span>{pkg.ecosystem === 'npm' ? 'npmjs.com' : 'pypi.org'}</span>
            <ExternalLink className="h-3 w-3 text-[#6e6e6e]" />
          </a>
        </div>
      </div>
    </div>
  );
}
