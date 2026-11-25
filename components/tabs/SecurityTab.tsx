'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ecosystem, SecurityData, SecurityAdvisory, VersionInfo } from '@/lib/types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Info,
  ArrowUpRight,
  ChevronDown,
  Search,
  Check,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  GitFork,
  Box,
  SlidersHorizontal,
  Filter,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { KeycapButton } from '../ui/KeycapButton';

interface SecurityTabProps {
  ecosystem: Ecosystem;
  packageName: string;
  version: string;
  onSelectVersion?: (version: string) => void;
}

function HighlightMatch({
  text,
  query,
  className = '',
  highlightClassName = 'bg-[#fef08a] text-[#713f12] font-semibold px-0.5 rounded-[3px] border border-[#fde047]/60 shadow-2xs',
}: {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const trimmedQuery = query.trim();
  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export function SecurityTab({ ecosystem, packageName, version: initialVersion, onSelectVersion }: SecurityTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active version state
  const [activeVersion, setActiveVersion] = useState<string>(initialVersion || 'latest');
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scope: 'all' | 'direct' | 'parent-ecosystem' | 'dependency'
  const [versionFilter, setVersionFilter] = useState<'selected' | 'all'>('selected');
  const [scope, setScope] = useState<'all' | 'direct' | 'parent-ecosystem' | 'dependency'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [cveSearchQuery, setCveSearchQuery] = useState('');
  const [expandedAdvisoryId, setExpandedAdvisoryId] = useState<string | null>(null);

  // Single filter popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Version dropdown list state
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([]);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [versionSearch, setVersionSearch] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync when prop version changes
  useEffect(() => {
    if (initialVersion && initialVersion !== activeVersion) {
      setActiveVersion(initialVersion);
    }
  }, [initialVersion]);

  // Fetch available versions for package
  useEffect(() => {
    let isMounted = true;
    setLoadingVersions(true);
    fetch(`/api/package/versions?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.versions && Array.isArray(json.versions)) {
          setAvailableVersions(json.versions);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingVersions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ecosystem, packageName]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsVersionDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch security data whenever activeVersion changes
  const fetchSecurity = async (verToFetch = activeVersion) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/package/security?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}&version=${encodeURIComponent(verToFetch)}`
      );
      if (!res.ok) throw new Error('Failed to load security advisories');
      const json: SecurityData = await res.json();
      setData(json);
      if (json.checkedVersion && json.checkedVersion !== verToFetch && verToFetch === 'latest') {
        setActiveVersion(json.checkedVersion);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading security info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity(activeVersion);
  }, [ecosystem, packageName, activeVersion]);

  const handleVersionChange = (ver: string) => {
    setActiveVersion(ver);
    setIsVersionDropdownOpen(false);
    setVersionSearch('');

    const params = new URLSearchParams(searchParams.toString());
    params.set('version', ver);
    router.push(`/?${params.toString()}`);

    if (onSelectVersion) {
      onSelectVersion(ver);
    }
  };

  const getSeverityBadgeVariant = (severity: SecurityAdvisory['severity']) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  // Base list of all discovered advisories (deduped historical)
  const allHistoricalList = data?.allHistoricalAdvisories || data?.advisories || [];

  // Direct active vulnerabilities affecting this specific version
  const activeList = allHistoricalList.filter((a) => a.affectsSelectedVersion);

  // If user has typed a CVE / keyword search query, search across allHistoricalList so
  // that historical / patched CVEs (like CVE-2026-111181) surface immediately with their status!
  // If no search query, honor the selected vs all versionFilter.
  const hasSearchQuery = cveSearchQuery.trim().length > 0;
  const versionFilteredList = hasSearchQuery
    ? allHistoricalList
    : versionFilter === 'selected'
    ? activeList
    : allHistoricalList;

  // Filter by scope
  const scopedList = versionFilteredList.filter((adv) => {
    if (scope === 'all') return true;
    if (scope === 'direct') return adv.componentType === 'direct';
    if (scope === 'parent-ecosystem') return adv.componentType === 'parent-ecosystem';
    if (scope === 'dependency') return adv.componentType === 'dependency';
    return true;
  });

  // Filter by severity & search query (CVE ID, title, summary, aliases)
  const filteredAdvisories = scopedList
    .filter((adv) => {
      if (severityFilter !== 'all' && adv.severity.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      if (hasSearchQuery) {
        const q = cveSearchQuery.trim().toLowerCase();
        const matchId = adv.id.toLowerCase().includes(q);
        const matchTitle = adv.title.toLowerCase().includes(q);
        const matchSummary = adv.summary.toLowerCase().includes(q);
        const matchAlias = (adv.aliases || []).some((a) => a.toLowerCase().includes(q));
        const matchComp = (adv.component || '').toLowerCase().includes(q);
        return matchId || matchTitle || matchSummary || matchAlias || matchComp;
      }
      return true;
    })
    .sort((a, b) => {
      if (hasSearchQuery) {
        const q = cveSearchQuery.trim().toLowerCase();
        const aExact = a.id.toLowerCase() === q || (a.aliases || []).some((al) => al.toLowerCase() === q);
        const bExact = b.id.toLowerCase() === q || (b.aliases || []).some((al) => al.toLowerCase() === q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aIdMatch = a.id.toLowerCase().includes(q) || (a.aliases || []).some((al) => al.toLowerCase().includes(q));
        const bIdMatch = b.id.toLowerCase().includes(q) || (b.aliases || []).some((al) => al.toLowerCase().includes(q));
        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;
      }
      return 0;
    });

  const filteredVersions = availableVersions.filter((v) =>
    v.version.toLowerCase().includes(versionSearch.toLowerCase())
  );

  const latestVersionObj = availableVersions.find((v) => v.isLatest);

  // Counts by component type within current version filtered list
  const directCount = versionFilteredList.filter((a) => a.componentType === 'direct').length;
  const parentCount = versionFilteredList.filter((a) => a.componentType === 'parent-ecosystem').length;
  const depCount = versionFilteredList.filter((a) => a.componentType === 'dependency').length;

  return (
    <div className="flex flex-col gap-6 animate-tab-in">
      {/* Top Banner: Status + Version Dropdown Selector */}
      <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Status icon and header */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-colors ${
                loading
                  ? 'bg-[#f1f6fd] text-[#475569]'
                  : activeList.length > 0
                  ? 'bg-[#feecee] text-[#e5484d]'
                  : 'bg-[#eefcf3] text-[#17a45c]'
              }`}
            >
              {loading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : activeList.length > 0 ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-sans font-bold text-[18px] text-[#0f172a]">
                  Vulnerabilities for <span className="font-mono text-[#0558d6]">{packageName}@v{data?.checkedVersion || activeVersion}</span>
                </h3>

                {data && (
                  <Badge variant={activeList.length > 0 ? 'danger' : 'success'}>
                    {activeList.length > 0 ? `${activeList.length} Active CVE${activeList.length > 1 ? 's' : ''}` : 'Release Clean'}
                  </Badge>
                )}
              </div>
              <p className="text-[13px] text-[#475569] mt-1">
                {loading
                  ? 'Auditing OSV.dev, Google deps.dev & NVD NIST databases…'
                  : activeList.length > 0
                  ? `${activeList.length} active security ${activeList.length === 1 ? 'vulnerability affects' : 'vulnerabilities affect'} release v${data?.checkedVersion || activeVersion}. Upgrade recommended.`
                  : `Release v${data?.checkedVersion || activeVersion} has 0 active CVEs (${allHistoricalList.length} historical CVE records tracked across ecosystem).`}
              </p>
            </div>
          </div>

          {/* Version Selector Dropdown & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto justify-end">
            {/* Version Dropdown Picker */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#f8fbff] hover:bg-[#eff6ff] border border-[#dce7f5] rounded-[12px] text-[13px] font-semibold text-[#0f172a] select-none transition-[background-color,border-color,transform] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                aria-expanded={isVersionDropdownOpen}
              >
                <span className="text-[#475569] font-normal">Version:</span>
                <span className="font-mono font-bold text-[#0558d6]">v{activeVersion}</span>
                <ChevronDown aria-hidden="true" className={`h-4 w-4 text-[#475569] transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Popover */}
              {isVersionDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] shadow-xl z-50 p-2 flex flex-col gap-2 origin-top-right overscroll-contain">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" aria-hidden="true" />
                    <input
                      type="text"
                      name="security-version-filter"
                      aria-label="Filter audited release version"
                      autoComplete="off"
                      spellCheck={false}
                      value={versionSearch}
                      onChange={(e) => setVersionSearch(e.target.value)}
                      placeholder="Search release version…"
                      className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#f8fbff] border border-[#dce7f5] rounded-[8px] focus:outline-none focus:border-[#087cf8] focus:ring-2 focus:ring-[#087cf8]/20 focus:bg-white transition-colors"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-[#f1f5f9] scrollbar-thin">
                    {filteredVersions.length === 0 ? (
                      <div className="p-4 text-center text-[12px] text-[#475569]">
                        {loadingVersions ? 'Loading versions list…' : 'No versions found.'}
                      </div>
                    ) : (
                      filteredVersions.map((v) => {
                        const isSelected = v.version === activeVersion;
                        return (
                          <button
                            key={v.version}
                            type="button"
                            onClick={() => handleVersionChange(v.version)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between text-[12px] transition-colors rounded-[8px] cursor-pointer ${
                              isSelected
                                ? 'bg-[#eff6ff] text-[#0558d6] font-bold'
                                : 'hover:bg-[#f8fbff] text-[#0f172a]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#0558d6]" />}
                              <span className="font-mono">v{v.version}</span>
                              {v.isLatest && (
                                <Badge variant="accent" size="sm">
                                  latest
                                </Badge>
                              )}
                              {v.isDeprecated && (
                                <Badge variant="warning" size="sm">
                                  deprecated
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-[#64748b]">
                              {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ''}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {latestVersionObj && activeVersion !== latestVersionObj.version && (
                    <div className="pt-2 border-t border-[#e8eef7]">
                      <button
                        type="button"
                        onClick={() => handleVersionChange(latestVersionObj.version)}
                        className="w-full text-center py-1.5 text-[11px] font-semibold text-[#0558d6] hover:bg-[#eff6ff] rounded-[8px] transition-colors flex items-center justify-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Jump to latest release (v{latestVersionObj.version})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Re-scan button */}
            <KeycapButton
              variant="secondary"
              size="sm"
              onClick={() => fetchSecurity(activeVersion)}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-scan
            </KeycapButton>
          </div>
        </div>

        {/* Multi-API Sources Attributions */}
        <div className="mt-4 pt-4 border-t border-[#e8eef7] flex flex-wrap items-center justify-between text-[11px] text-[#475569] gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Aggregated Intelligence:</span>
            <a href="https://google.github.io/osv.dev/api/" target="_blank" rel="noopener noreferrer" className="text-[#0558d6] hover:underline font-mono">
              OSV.dev v1
            </a>
            <span>•</span>
            <a href="https://docs.deps.dev/api/v3/" target="_blank" rel="noopener noreferrer" className="text-[#0558d6] hover:underline font-mono">
              deps.dev v3
            </a>
            <span>•</span>
            <a href="https://nvd.nist.gov/developers/vulnerabilities" target="_blank" rel="noopener noreferrer" className="text-[#0558d6] hover:underline font-mono">
              NVD NIST 2.0
            </a>
          </div>
          <span>
            Target: <strong className="text-[#0f172a]">{ecosystem.toUpperCase()}</strong> • <strong className="text-[#0f172a]">{packageName}@{data?.checkedVersion || activeVersion}</strong>
          </span>
        </div>
      </div>

      {/* Audited Components Summary Pills */}
      {data && data.auditedComponents && data.auditedComponents.length > 1 && (
        <div className="p-4 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[16px] text-[12px] flex flex-col gap-2 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
          <div className="flex items-center justify-between text-[#475569] font-semibold">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#0558d6]" />
              Audited Ecosystem & Supply Chain Components ({data.auditedComponents.length})
            </span>
            <span className="text-[11px] font-normal text-[#475569]">
              Monorepos and direct dependencies audited in OSV / NVD
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {data.auditedComponents.map((comp) => (
              <div
                key={comp.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#f8fbff] border border-[#dce7f5]"
              >
                <span className="font-mono font-semibold text-[#0f172a]">{comp.name}</span>
                <span className="text-[10px] text-[#475569]">
                  ({comp.type === 'direct' ? 'Direct' : comp.type === 'parent-ecosystem' ? 'Core Monorepo' : 'Dependency'})
                </span>
                {comp.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#feecee] text-[#e5484d]">
                    {comp.count} CVEs
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* De-cluttered Control Bar: 2-Segment Switcher + Single Filter Button + Live Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/92 backdrop-blur-xl border border-white/90 p-3 rounded-[16px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
        {/* 2-Segment Switcher with Clearer Wording */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f1f6fd] rounded-[12px] border border-[#dce7f5] shrink-0">
          <button
            type="button"
            onClick={() => setVersionFilter('selected')}
            className={`px-3.5 py-1.5 rounded-[9px] text-[12px] font-semibold transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer flex items-center gap-2 select-none ${
              versionFilter === 'selected'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeList.length > 0 ? 'bg-[#e5484d]' : 'bg-[#17a45c]'}`} />
            <span>Current Release (v{activeVersion})</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeList.length > 0 ? 'bg-[#feecee] text-[#e5484d]' : 'bg-[#eefcf3] text-[#17a45c]'
              }`}
            >
              {activeList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVersionFilter('all')}
            className={`px-3.5 py-1.5 rounded-[9px] text-[12px] font-semibold transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer flex items-center gap-2 select-none ${
              versionFilter === 'all'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a]'
            }`}
          >
            <span>Full Security History</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-medium bg-[#dce7f5] text-[#555]">
              {allHistoricalList.length}
            </span>
          </button>
        </div>

        {/* Right Side: Single Filter Popover Button + Search */}
        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          {/* Single Filter Button */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[12px] font-semibold transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer select-none active:scale-[0.98] ${
                isFilterOpen || severityFilter !== 'all' || scope !== 'all'
                  ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#0558d6]'
                  : 'bg-[#f8fbff] border-[#dce7f5] text-[#0f172a] hover:bg-[#f1f6fd]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#0558d6]" />
              <span>Filter</span>
              {(severityFilter !== 'all' || scope !== 'all') && (
                <span className="h-4 w-4 rounded-full bg-[#0558d6] text-white text-[10px] font-bold flex items-center justify-center">
                  {(severityFilter !== 'all' ? 1 : 0) + (scope !== 'all' ? 1 : 0)}
                </span>
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#64748b] transition-transform duration-200 ${
                  isFilterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Filter Dropdown Popover */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-xl z-50 p-3.5 flex flex-col gap-3">
                {/* Severity Selection */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">
                    Severity Level
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-[6px] transition-colors cursor-pointer uppercase ${
                          severityFilter === sev
                            ? 'bg-[#0558d6] text-white'
                            : 'bg-[#f1f6fd] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Component Scope Selection */}
                <div className="pt-2 border-t border-[#e8eef7]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">
                    Component Scope
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setScope('all')}
                      className={`px-2.5 py-1 text-[11.5px] rounded-[6px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                        scope === 'all'
                          ? 'bg-[#eff6ff] text-[#0558d6] font-semibold'
                          : 'text-[#64748b] hover:bg-[#f8fbff]'
                      }`}
                    >
                      <span>All Components</span>
                      <span className="font-mono text-[11px]">({versionFilteredList.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope('direct')}
                      className={`px-2.5 py-1 text-[11.5px] rounded-[6px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                        scope === 'direct'
                          ? 'bg-[#eff6ff] text-[#0558d6] font-semibold'
                          : 'text-[#64748b] hover:bg-[#f8fbff]'
                      }`}
                    >
                      <span>Direct Component Only</span>
                      <span className="font-mono text-[11px]">({directCount})</span>
                    </button>
                    {parentCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setScope('parent-ecosystem')}
                        className={`px-2.5 py-1 text-[11.5px] rounded-[6px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                          scope === 'parent-ecosystem'
                            ? 'bg-[#eff6ff] text-[#0558d6] font-semibold'
                            : 'text-[#64748b] hover:bg-[#f8fbff]'
                        }`}
                      >
                        <span>Core Monorepo</span>
                        <span className="font-mono text-[11px]">({parentCount})</span>
                      </button>
                    )}
                    {depCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setScope('dependency')}
                        className={`px-2.5 py-1 text-[11.5px] rounded-[6px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                          scope === 'dependency'
                            ? 'bg-[#eff6ff] text-[#0558d6] font-semibold'
                            : 'text-[#64748b] hover:bg-[#f8fbff]'
                        }`}
                      >
                        <span>Dependencies</span>
                        <span className="font-mono text-[11px]">({depCount})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reset Filters Option */}
                {(severityFilter !== 'all' || scope !== 'all') && (
                  <div className="pt-2 border-t border-[#e8eef7] flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSeverityFilter('all');
                        setScope('all');
                      }}
                      className="text-[11px] font-semibold text-[#0558d6] hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Search CVE / Keyword */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" aria-hidden="true" />
            <input
              type="text"
              name="cve-filter"
              aria-label="Filter CVEs by ID or keyword"
              autoComplete="off"
              spellCheck={false}
              value={cveSearchQuery}
              onChange={(e) => setCveSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setCveSearchQuery('');
              }}
              placeholder="Search CVE ID (e.g. CVE-2024)…"
              className="w-full pl-9 pr-16 py-1.5 text-[12px] bg-[#f8fbff] border border-[#dce7f5] rounded-[10px] focus:outline-none focus:border-[#087cf8] focus:ring-2 focus:ring-[#087cf8]/20 focus:bg-white transition-colors"
            />
            {cveSearchQuery && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-[#eff6ff] text-[#0558d6] border border-[#bfdbfe] tabular-nums">
                  {filteredAdvisories.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCveSearchQuery('')}
                  aria-label="Clear CVE search filter"
                  className="text-[11px] text-[#475569] hover:text-[#0f172a] cursor-pointer rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0558d6]"
                  title="Clear search (Esc)"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical View Banner Indicator */}
      {versionFilter === 'all' && (
        <div className="px-4 py-3 bg-[#f8f9ff] border border-[#bfdbfe] rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-[#334155]">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#0558d6] shrink-0" />
            <span>
              Viewing complete vulnerability history across all versions ({allHistoricalList.length} total records).{' '}
              <strong className="text-[#e5484d]">{activeList.length} active</strong> in v{activeVersion},{' '}
              <strong className="text-[#17a45c]">{allHistoricalList.length - activeList.length} patched</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setVersionFilter('selected')}
            className="text-[#0558d6] hover:underline font-semibold cursor-pointer shrink-0"
          >
            Show Only Active for v{activeVersion} ({activeList.length}) →
          </button>
        </div>
      )}

      {/* Loading Skeleton: High Fidelity Advisory Cards */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-white/92 backdrop-blur-xl border border-white/90 rounded-[18px] shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 bg-[#e8eef7] rounded-[6px]" />
                  <div className="h-6 w-28 bg-[#e8eef7] rounded-[6px]" />
                </div>
                <div className="h-5 w-16 bg-[#e8eef7] rounded" />
              </div>
              <div className="h-4 w-3/4 bg-[#e8eef7] rounded" />
              <div className="h-3.5 w-1/2 bg-[#e8eef7] rounded" />
              <div className="pt-2 border-t border-[#e8eef7] flex items-center gap-3">
                <div className="h-3 w-32 bg-[#e8eef7] rounded" />
                <div className="h-3 w-28 bg-[#e8eef7] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="p-6 bg-[#feecee] border border-[#fcccd1] rounded-[16px] text-[#e5484d] flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-[14px]">Error checking security database</p>
            <p className="text-[12px] opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Clean Release View when no active CVEs affect selected version and NOT searching */}
      {data && versionFilter === 'selected' && activeList.length === 0 && !hasSearchQuery && !loading && (
        <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-8 text-center flex flex-col items-center justify-center shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
          <div className="w-14 h-14 rounded-full bg-[#eefcf3] text-[#17a45c] flex items-center justify-center mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h4 className="font-sans font-bold text-[18px] text-[#0f172a]">
            Release v{activeVersion} is Clean
          </h4>
          <p className="text-[13px] text-[#475569] max-w-[480px] mt-1.5 leading-relaxed">
            Zero known security advisories or active CVEs directly affect version{' '}
            <strong className="font-mono text-[#0f172a]">v{activeVersion}</strong>.
          </p>

          {/* Historical discovery hint / button */}
          {allHistoricalList.length > 0 && (
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
              <KeycapButton
                variant="secondary"
                size="sm"
                onClick={() => setVersionFilter('all')}
                className="flex items-center gap-1.5 text-[12px]"
              >
                Show All {allHistoricalList.length} Past Vulnerabilities
              </KeycapButton>
              <span className="text-[12px] text-[#475569]">
                ({allHistoricalList.length} historical CVEs patched in this or prior releases)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active Search Result Notification Banner */}
      {!loading && hasSearchQuery && filteredAdvisories.length > 0 && (
        <div className="px-4 py-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-[12px] flex items-center justify-between text-[12px] text-[#0558d6]">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>
              Showing <strong>{filteredAdvisories.length}</strong> {filteredAdvisories.length === 1 ? 'record' : 'records'} matching &ldquo;{cveSearchQuery}&rdquo; across package history
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCveSearchQuery('')}
            className="underline hover:text-[#19409b] font-semibold cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Empty Search Result State */}
      {!loading && hasSearchQuery && filteredAdvisories.length === 0 && (
        <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-8 text-center flex flex-col items-center justify-center shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)]">
          <div className="w-12 h-12 rounded-full bg-[#f1f6fd] text-[#475569] flex items-center justify-center mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h4 className="font-sans font-bold text-[16px] text-[#0f172a]">
            No advisories matching &ldquo;{cveSearchQuery}&rdquo;
          </h4>
          <p className="text-[13px] text-[#475569] max-w-[420px] mt-1.5 leading-relaxed">
            Neither active nor historical security records for <strong className="font-mono text-[#0f172a]">{packageName}</strong> match this identifier or keyword.
          </p>
          <div className="mt-4">
            <KeycapButton
              variant="secondary"
              size="sm"
              onClick={() => setCveSearchQuery('')}
            >
              Clear Search Filter
            </KeycapButton>
          </div>
        </div>
      )}

      {/* Advisory Cards List */}
      {!loading && data && filteredAdvisories.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Advisories Count & Active Filters Indicator */}
          <div className="flex items-center justify-between text-[12.5px] text-[#64748b] px-1">
            <span>
              Showing <strong className="text-[#0f172a]">{filteredAdvisories.length}</strong> of {scopedList.length} security advisories
              {severityFilter !== 'all' && (
                <span className="ml-1 text-[#0558d6] font-semibold">({severityFilter.toUpperCase()} only)</span>
              )}
            </span>
            {(severityFilter !== 'all' || scope !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSeverityFilter('all');
                  setScope('all');
                }}
                className="text-[#0558d6] hover:underline font-semibold cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {filteredAdvisories.map((advisory) => {
              const primaryId = advisory.id;
              const cveAlias = advisory.aliases?.find((a) => a.startsWith('CVE-')) || (primaryId.startsWith('CVE-') ? primaryId : null);
              const ghsaAlias = primaryId.startsWith('GHSA-') ? primaryId : advisory.aliases?.find((a) => a.startsWith('GHSA-'));
              const osvUrl = advisory.sourceUrl || `https://osv.dev/vulnerability/${primaryId}`;
              const nvdUrl = cveAlias ? `https://nvd.nist.gov/vuln/detail/${cveAlias}` : null;
              const githubUrl = ghsaAlias ? `https://github.com/advisories/${ghsaAlias}` : null;

              const isExpanded = expandedAdvisoryId === advisory.id;

              return (
                <div
                  key={`${advisory.id}-${advisory.component}`}
                  className="bg-white/92 backdrop-blur-xl border border-white/90 hover:border-[#93c5fd] rounded-[18px] p-5 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150"
                >
                  {/* Top Bar with ID, Status Badge, Component Tag, Severity, and External Links */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e8eef7]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getSeverityBadgeVariant(advisory.severity)}>
                        {advisory.severity}
                      </Badge>

                      {/* Explicit Status Badge: Affects Selected Version vs Patched */}
                      {advisory.affectsSelectedVersion ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#feecee] text-[#e5484d] border border-[#fcccd1]">
                          <AlertTriangle className="h-3 w-3" /> Affects v{activeVersion}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eefcf3] text-[#17a45c] border border-[#bbf7d0]">
                          <CheckCircle2 className="h-3 w-3" /> Patched in v{advisory.fixedVersion || 'prior version'}
                        </span>
                      )}

                      {/* Primary ID with realtime highlighting */}
                      {(() => {
                        const isPrimaryMatch =
                          hasSearchQuery &&
                          advisory.id.toLowerCase().includes(cveSearchQuery.trim().toLowerCase());
                        return (
                          <span
                            className={`font-mono text-[14px] font-bold px-1.5 py-0.5 rounded-md transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ${
                              isPrimaryMatch
                                ? 'bg-[#eff6ff] text-[#0558d6] ring-1.5 ring-[#38bdf8] shadow-xs'
                                : 'text-[#0f172a]'
                            }`}
                          >
                            <HighlightMatch
                              text={advisory.id}
                              query={cveSearchQuery}
                              highlightClassName="bg-[#fef08a] text-[#713f12] font-bold px-0.5 rounded-[2px]"
                            />
                          </span>
                        );
                      })()}

                      {/* List of Alias IDs with realtime highlighting */}
                      {advisory.aliases?.map((alias) => {
                        const isAliasMatch =
                          hasSearchQuery &&
                          alias.toLowerCase().includes(cveSearchQuery.trim().toLowerCase());
                        return (
                          <span
                            key={alias}
                            className={`font-mono text-[11px] px-1.5 py-0.5 rounded transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ${
                              isAliasMatch
                                ? 'bg-[#fef9c3] text-[#713f12] ring-1.5 ring-[#eab308] font-bold shadow-xs'
                                : 'text-[#475569] bg-[#f1f6fd]'
                            }`}
                          >
                            <HighlightMatch
                              text={alias}
                              query={cveSearchQuery}
                              highlightClassName="bg-[#fef08a] text-[#713f12] font-bold px-0.5 rounded-[2px]"
                            />
                          </span>
                        );
                      })}

                      {/* Component Origin Badge */}
                      {advisory.component && advisory.component !== packageName && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#eff6ff] text-[#0558d6] border border-[#bfdbfe]">
                          {advisory.componentType === 'parent-ecosystem' ? 'Core Monorepo: ' : 'Dependency: '}
                          <code className="font-mono font-bold">{advisory.component}</code>
                        </span>
                      )}
                    </div>

                    {/* Direct clickable links to NVD, OSV, GitHub databases */}
                    <div className="flex items-center gap-3 text-[12px] flex-wrap">
                      {nvdUrl && (
                        <a
                          href={nvdUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0558d6] hover:underline flex items-center gap-0.5 font-medium"
                          title="View on National Vulnerability Database (NVD NIST)"
                        >
                          NVD Record <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                      {githubUrl && (
                        <a
                          href={githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0558d6] hover:underline flex items-center gap-0.5 font-medium"
                          title="View on GitHub Advisory Database"
                        >
                          GitHub Advisory <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                      <a
                        href={osvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0558d6] hover:underline flex items-center gap-0.5 font-medium"
                        title="View on OSV.dev (Open Source Vulnerabilities)"
                      >
                        OSV Report <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Title & Summary with realtime query highlight */}
                  <div className="mt-3">
                    <h4 className="font-sans font-semibold text-[15px] text-[#0f172a]">
                      <HighlightMatch text={advisory.title} query={cveSearchQuery} />
                    </h4>
                    {advisory.summary && advisory.title !== advisory.summary && (
                      <p className="text-[13px] text-[#475569] mt-1.5 leading-relaxed line-clamp-2">
                        <HighlightMatch text={advisory.summary} query={cveSearchQuery} />
                      </p>
                    )}
                  </div>

                  {/* Details grid: Affected version range, fixed version, published date */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8fbff] p-3.5 rounded-[12px] border border-[#e8eef7] text-[12px]">
                    <div>
                      <span className="text-[#475569] block font-medium">Affected Version Range:</span>
                      <span className="font-mono text-[#e5484d] font-semibold">{advisory.affectedRange || 'Unspecified'}</span>
                    </div>
                    <div>
                      <span className="text-[#475569] block font-medium">Patched / Fixed Version:</span>
                      <span className="font-mono text-[#17a45c] font-semibold">
                        {advisory.fixedVersion ? `>= ${advisory.fixedVersion}` : 'Consult advisory notes'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#475569] block font-medium">Published Date:</span>
                      <span className="text-[#0f172a]">
                        {advisory.publishedAt ? new Date(advisory.publishedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Technical Details / Disclosure with realtime query highlight */}
                  {isExpanded && advisory.details && (
                    <div className="mt-4 p-4 bg-[#f8fbff] border border-[#dce7f5] rounded-[12px] text-[12px] font-mono leading-relaxed text-[#333333] whitespace-pre-wrap max-h-80 overflow-y-auto">
                      <HighlightMatch text={advisory.details} query={cveSearchQuery} />
                    </div>
                  )}

                  {/* Footer with Remediation & Expand Toggle */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f1f6fd] text-[12px]">
                    <div className="flex items-center gap-1.5 text-[#475569]">
                      {advisory.component && advisory.component !== packageName ? (
                        <span>
                          Originates in upstream <strong className="font-mono text-[#0f172a]">{advisory.component}</strong> ({advisory.componentType === 'parent-ecosystem' ? 'core monorepo framework' : 'dependency'})
                        </span>
                      ) : (
                        <span>
                          Direct advisory for <strong className="font-mono text-[#0f172a]">{packageName}</strong>
                        </span>
                      )}
                    </div>

                    {advisory.details && (
                      <button
                        type="button"
                        onClick={() => setExpandedAdvisoryId(isExpanded ? null : advisory.id)}
                        className="text-[#0558d6] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? 'Hide technical write-up' : 'View disclosure write-up'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zero State if filtered query has no hits (when not showing clean release card) */}
      {data && filteredAdvisories.length === 0 && (versionFilter !== 'selected' || activeList.length > 0) && !loading && (
        <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-[20px] p-8 text-center flex flex-col items-center justify-center">
          <Shield className="h-8 w-8 text-[#17a45c] mb-2" />
          <h4 className="font-sans font-bold text-[16px] text-[#0f172a]">No Matching Advisories Found</h4>
          <p className="text-[13px] text-[#475569] max-w-[440px] mt-1">
            {cveSearchQuery
              ? `No vulnerabilities match query "${cveSearchQuery}".`
              : 'Zero security advisories found under this filter or scope.'}
          </p>
        </div>
      )}
    </div>
  );
}
