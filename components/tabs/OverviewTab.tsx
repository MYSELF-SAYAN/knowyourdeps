'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PackageOverview, ReadmeData, VersionInfo } from '@/lib/types';
import {
  Download,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Scale,
  BookOpen,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { marked } from 'marked';

interface OverviewTabProps {
  pkg: PackageOverview;
  activeVersion?: string;
  onSelectTab: (tab: any) => void;
  onSelectVersion?: (version: string) => void;
}

export function OverviewTab({
  pkg,
  activeVersion: propVersion,
  onSelectTab,
  onSelectVersion,
}: OverviewTabProps) {
  const [currentVersion, setCurrentVersion] = useState<string>(
    propVersion || pkg.latestVersion || 'latest'
  );
  const [readme, setReadme] = useState<ReadmeData | null>(null);
  const [loadingReadme, setLoadingReadme] = useState(true);
  const [readmeError, setReadmeError] = useState<string | null>(null);

  // Version dropdown picker state
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [versionSearch, setVersionSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync prop version if it changes
  useEffect(() => {
    if (propVersion && propVersion !== currentVersion) {
      setCurrentVersion(propVersion);
    }
  }, [propVersion]);

  // Fetch available versions for selector
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/package/versions?ecosystem=${pkg.ecosystem}&name=${encodeURIComponent(pkg.name)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.versions && Array.isArray(json.versions)) {
          setAvailableVersions(json.versions);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pkg.ecosystem, pkg.name]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch version-wise README whenever currentVersion changes
  useEffect(() => {
    let isMounted = true;
    setLoadingReadme(true);
    setReadmeError(null);

    const verToFetch = currentVersion || 'latest';
    fetch(
      `/api/package/readme?ecosystem=${pkg.ecosystem}&name=${encodeURIComponent(
        pkg.name
      )}&version=${encodeURIComponent(verToFetch)}`
    )
      .then((res) => res.json())
      .then((data: ReadmeData) => {
        if (!isMounted) return;
        if (data.error && !data.content) {
          setReadmeError(data.error);
        } else {
          setReadme(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setReadmeError(err.message || 'Failed to load README');
      })
      .finally(() => {
        if (isMounted) setLoadingReadme(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pkg.ecosystem, pkg.name, currentVersion]);

  const handleVersionChange = (ver: string) => {
    setCurrentVersion(ver);
    setIsDropdownOpen(false);
    setVersionSearch('');
    if (onSelectVersion) {
      onSelectVersion(ver);
    }
  };

  const filteredVersions = availableVersions.filter((v) =>
    v.version.toLowerCase().includes(versionSearch.toLowerCase())
  );
  const latestVersionObj = availableVersions.find((v) => v.isLatest);

  // Parse markdown content to HTML with GFM and open external links in new tabs
  const parsedHtml = React.useMemo(() => {
    if (!readme?.content) return '';
    try {
      // Use GFM with breaks: false so badges and inline elements stay inline
      let raw = marked.parse(readme.content, { gfm: true, breaks: false }) as string;
      // Ensure all <a> tags open in new tab securely
      raw = raw.replace(/<a\s+(?!href="#)([^>]+)>/gi, '<a $1 target="_blank" rel="noopener noreferrer">');
      return raw;
    } catch {
      return `<pre class="whitespace-pre-wrap font-mono text-[13px]">${readme.content}</pre>`;
    }
  }, [readme?.content]);

  return (
    <div className="flex flex-col gap-5 animate-tab-in">
      {/* 4 Quick Stat Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Downloads */}
        <div
          onClick={() => onSelectTab('history')}
          className="flex flex-col justify-between p-4 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#bfdbfe] hover:shadow-[0_4px_16px_rgba(0,51,255,0.06)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#555a64]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Weekly Downloads</span>
            <Download className="h-4 w-4 text-[#a6a6a6] group-hover:text-[#1d53c6] transition-colors" />
          </div>
          <div className="mt-2 font-display text-[26px] font-bold text-[#1a1a1a] tabular-nums">
            {pkg.totalDownloadsWeekly ? pkg.totalDownloadsWeekly.toLocaleString() : 'N/A'}
          </div>
          <span className="mt-1 text-[11px] text-[#1d53c6] font-medium group-hover:underline">
            View stats & metrics →
          </span>
        </div>

        {/* Security Status */}
        <div
          onClick={() => onSelectTab('security')}
          className="flex flex-col justify-between p-4 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#bfdbfe] hover:shadow-[0_4px_16px_rgba(0,51,255,0.06)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#555a64]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Security Status</span>
            {pkg.securityStatus === 'safe' ? (
              <ShieldCheck className="h-4 w-4 text-[#17a45c]" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[#e5484d]" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[26px] font-bold text-[#1a1a1a] tabular-nums">
              {pkg.vulnerabilitiesCount}
            </span>
            <span className="text-[12px] text-[#6e6e6e]">known advisories</span>
          </div>
          <span className="mt-1 text-[11px] text-[#1d53c6] font-medium group-hover:underline">
            Multi-engine CVE scanner →
          </span>
        </div>

        {/* License */}
        <div className="flex flex-col justify-between p-4 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#555a64]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">License</span>
            <Scale className="h-4 w-4 text-[#a6a6a6]" />
          </div>
          <div className="mt-2 font-display text-[22px] font-bold text-[#1a1a1a] truncate" title={pkg.license}>
            {pkg.license}
          </div>
          <span className="mt-1 text-[11px] text-[#6e6e6e]">Standard open-source license</span>
        </div>

        {/* Latest Release */}
        <div className="flex flex-col justify-between p-4 bg-white border border-[#e8e8e8] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#555a64]">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">Latest Release</span>
            <Layers className="h-4 w-4 text-[#a6a6a6]" />
          </div>
          <div className="mt-2 font-display text-[26px] font-bold text-[#1a1a1a] truncate">
            v{pkg.latestVersion}
          </div>
          <span className="mt-1 text-[11px] text-[#6e6e6e]">
            {pkg.totalReleases ? `${pkg.totalReleases} lifetime releases` : 'Current registry production tag'}
          </span>
        </div>
      </div>

      {/* Version-Wise README.md Container */}
      <div className="bg-white border border-[#e8e8e8] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Top Control Bar: README Header + Version Switcher */}
        <div className="px-6 py-3.5 border-b border-[#e8e8e8] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#1d53c6]" />
            <span className="font-mono font-bold text-[13px] text-[#1a1a1a]">README.md</span>
            <span className="text-[#a6a6a6]">•</span>
            <span className="text-[12px] text-[#6e6e6e]">
              Viewing documentation for <strong className="font-mono text-[#1a1a1a]">v{currentVersion}</strong>
            </span>
            {readme?.source && (
              <span className="text-[10.5px] text-[#555a64] bg-[#f0f0f0] px-2 py-0.5 rounded-full font-medium">
                {readme.source}
              </span>
            )}
          </div>

          {/* Version Picker Popover */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f4f4f4] border border-[#e8e8e8] rounded-[10px] text-[12px] font-semibold text-[#1a1a1a] select-none transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span className="text-[#555a64] font-normal">Version:</span>
              <span className="font-mono font-bold text-[#1d53c6]">v{currentVersion}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#555a64] transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#e8e8e8] rounded-[16px] shadow-xl z-50 p-2 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555a64]" />
                  <input
                    type="text"
                    value={versionSearch}
                    onChange={(e) => setVersionSearch(e.target.value)}
                    placeholder="Search version README..."
                    className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#f8f8f8] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1d53c6] focus:bg-white transition-colors"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-[#f4f4f4] scrollbar-thin">
                  {filteredVersions.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-[#555a64]">
                      No versions found.
                    </div>
                  ) : (
                    filteredVersions.map((v) => {
                      const isSelected = v.version === currentVersion;
                      return (
                        <button
                          key={v.version}
                          type="button"
                          onClick={() => handleVersionChange(v.version)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-[12px] transition-colors rounded-[8px] cursor-pointer ${
                            isSelected
                              ? 'bg-[#eff6ff] text-[#1d53c6] font-bold'
                              : 'hover:bg-[#f8f8f8] text-[#1a1a1a]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#1d53c6]" />}
                            <span className="font-mono">v{v.version}</span>
                            {v.isLatest && (
                              <Badge variant="accent" size="sm">
                                latest
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-[#a6a6a6]">
                            {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ''}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {latestVersionObj && currentVersion !== latestVersionObj.version && (
                  <div className="pt-2 border-t border-[#f0f0f0]">
                    <button
                      type="button"
                      onClick={() => handleVersionChange(latestVersionObj.version)}
                      className="w-full text-center py-1.5 text-[11px] font-semibold text-[#1d53c6] hover:bg-[#eff6ff] rounded-[8px] transition-colors flex items-center justify-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Jump to latest release (v{latestVersionObj.version})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* README Content Area with Rich Markdown Skeleton */}
        <div className="p-6 sm:p-8">
          {loadingReadme ? (
            <div className="space-y-6 py-2 animate-in fade-in duration-150">
              {/* Header loader indicator */}
              <div className="flex items-center gap-2 text-[12px] text-[#1d53c6] font-medium mb-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#1d53c6]" />
                <span>Loading documentation for v{currentVersion}...</span>
              </div>
              {/* Document title skeleton */}
              <div className="h-8 w-64 bg-[#f0f0f0] rounded-[8px] animate-pulse" />
              {/* Badge row skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-[#f0f0f0] rounded animate-pulse" />
                <div className="h-5 w-20 bg-[#f0f0f0] rounded animate-pulse" />
                <div className="h-5 w-24 bg-[#f0f0f0] rounded animate-pulse" />
              </div>
              {/* Paragraph skeleton */}
              <div className="space-y-2.5">
                <div className="h-3.5 w-full bg-[#f0f0f0] rounded animate-pulse" />
                <div className="h-3.5 w-11/12 bg-[#f0f0f0] rounded animate-pulse" />
                <div className="h-3.5 w-4/5 bg-[#f0f0f0] rounded animate-pulse" />
              </div>
              {/* Code block skeleton */}
              <div className="h-28 bg-[#161b22]/5 border border-[#e8e8e8] rounded-[12px] p-4 flex flex-col justify-center space-y-2 animate-pulse">
                <div className="h-3.5 w-3/4 bg-[#e2e8f0] rounded" />
                <div className="h-3.5 w-1/2 bg-[#e2e8f0] rounded" />
              </div>
              {/* Paragraph skeleton */}
              <div className="space-y-2.5">
                <div className="h-3.5 w-full bg-[#f0f0f0] rounded animate-pulse" />
                <div className="h-3.5 w-5/6 bg-[#f0f0f0] rounded animate-pulse" />
              </div>
            </div>
          ) : readmeError ? (
            <div className="p-6 bg-[#fff8eb] border border-[#fde8c2] rounded-[14px] text-[#bf5b00] flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-[14px]">README unavailable for v{currentVersion}</p>
                <p className="text-[12px] opacity-90 mt-0.5">{readmeError}</p>
              </div>
            </div>
          ) : !readme?.content || readme.content.trim().length === 0 ? (
            <div className="py-16 text-center text-[#555a64] flex flex-col items-center">
              <FileText className="h-10 w-10 text-[#d0d0d0] mb-2" />
              <p className="text-[14px] font-medium text-[#1a1a1a]">No README provided</p>
              <p className="text-[12px] text-[#6e6e6e] max-w-sm mt-1">
                The authors did not include a markdown documentation file for this release.
              </p>
            </div>
          ) : (
            <article
              className="markdown-body text-[#1a1a1a] max-w-none"
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
