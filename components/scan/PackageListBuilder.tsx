'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  Search,
  Package as PackageIcon,
} from 'lucide-react';
import { KeycapButton } from '@/components/ui/KeycapButton';
import type { Ecosystem, SearchResultItem, VersionInfo } from '@/lib/types';

export interface StagedPackage {
  name: string;
  version: string;
  availableVersions: string[];
}

interface PackageListBuilderProps {
  onScanPackages: (ecosystem: Ecosystem, packages: Array<{ name: string; version: string }>) => Promise<void>;
  onError: (msg: string | null) => void;
}

export function PackageListBuilder({ onScanPackages, onError }: PackageListBuilderProps) {
  const [ecosystem, setEcosystem] = useState<Ecosystem>('npm');
  const [pkgInput, setPkgInput] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  const [selectedPkg, setSelectedPkg] = useState('');
  const [versions, setVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');

  const [staged, setStaged] = useState<StagedPackage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for package autocomplete
  useEffect(() => {
    const q = pkgInput.trim();
    if (!q || q === selectedPkg) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/search?ecosystem=${ecosystem}&q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.results || []).slice(0, 6));
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [pkgInput, ecosystem, selectedPkg]);

  const fetchVersionsFor = async (eco: Ecosystem, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setLoadingVersions(true);
    setVersions([]);
    setSelectedVersion('');
    onError(null);

    try {
      const res = await fetch(
        `/api/package/versions?ecosystem=${eco}&name=${encodeURIComponent(clean)}`
      );
      if (!res.ok) {
        setVersions([]);
        setSelectedVersion('latest');
        return;
      }
      const data = await res.json();
      const list: string[] = Array.isArray(data.versions)
        ? data.versions.map((v: VersionInfo) => v.version).filter(Boolean)
        : [];
      setVersions(list);
      setSelectedVersion(list[0] || 'latest');
    } catch {
      setVersions([]);
      setSelectedVersion('latest');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSelectSuggestion = async (name: string) => {
    setPkgInput(name);
    setSelectedPkg(name);
    setShowSuggestions(false);
    await fetchVersionsFor(ecosystem, name);
  };

  const handleSwitchEcosystem = (nextEco: Ecosystem) => {
    if (nextEco === ecosystem) return;
    setEcosystem(nextEco);
    setPkgInput('');
    setSelectedPkg('');
    setSuggestions([]);
    setVersions([]);
    setSelectedVersion('');
    setStaged([]);
    onError(null);
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = pkgInput.trim();
    if (!name) {
      onError('Enter a package name before adding.');
      return;
    }

    onError(null);
    let vers = versions;
    let ver = selectedVersion;

    // If user typed a package name directly without clicking an autocomplete item, fetch its versions first
    if (name !== selectedPkg || vers.length === 0) {
      setLoadingVersions(true);
      try {
        const res = await fetch(
          `/api/package/versions?ecosystem=${ecosystem}&name=${encodeURIComponent(name)}`
        );
        if (res.ok) {
          const data = await res.json();
          vers = Array.isArray(data.versions)
            ? data.versions.map((v: VersionInfo) => v.version).filter(Boolean)
            : [];
        }
      } catch {
        vers = [];
      } finally {
        setLoadingVersions(false);
      }

      if (vers.length === 0) {
        onError(`Package "${name}" was not found in ${ecosystem.toUpperCase()}.`);
        return;
      }
      ver = vers[0];
    }

    const chosenVersion = ver || vers[0] || 'latest';

    setStaged((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          name,
          version: chosenVersion,
          availableVersions: vers,
        };
        return updated;
      }
      return [...prev, { name, version: chosenVersion, availableVersions: vers }];
    });

    setPkgInput('');
    setSelectedPkg('');
    setVersions([]);
    setSelectedVersion('');
    setSuggestions([]);
  };

  const handleUpdateStagedVersion = (name: string, nextVersion: string) => {
    setStaged((prev) =>
      prev.map((item) =>
        item.name === name ? { ...item, version: nextVersion } : item
      )
    );
  };

  const handleRemoveStaged = (name: string) => {
    setStaged((prev) => prev.filter((item) => item.name !== name));
  };

  const handleScanClick = async () => {
    if (staged.length === 0) {
      onError('Add at least one package before scanning.');
      return;
    }
    await onScanPackages(
      ecosystem,
      staged.map(({ name, version }) => ({ name, version }))
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-5">
      <div className="space-y-5">
      {/* Step 1: Ecosystem Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-[#dce7f5] bg-[#f8fbff] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-[#0f172a]">
            1. Select Registry Ecosystem
          </p>
          <p className="text-[12px] text-[#475569]">
            Choose npm or PyPI before adding packages and versions.
          </p>
        </div>

        <div
          role="group"
          aria-label="Target package ecosystem"
          className="inline-flex items-center rounded-xl bg-white p-1 border border-[#dce7f5] self-start sm:self-auto"
        >
          {(['npm', 'pypi'] as Ecosystem[]).map((eco) => {
            const active = ecosystem === eco;
            return (
              <button
                key={eco}
                type="button"
                aria-pressed={active}
                onClick={() => handleSwitchEcosystem(eco)}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6] ${
                  active
                    ? 'bg-[#0558d6] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                {eco === 'npm' ? 'npm (Node.js)' : 'PyPI (Python)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Add Package + Version */}
      <form onSubmit={handleAddPackage} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div ref={containerRef} className="sm:col-span-6 relative">
          <label
            htmlFor="builder-pkg-input"
            className="block text-[12.5px] font-medium text-[#334155] mb-1.5"
          >
            2. Package name ({ecosystem === 'npm' ? 'npm' : 'PyPI'})
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]"
              aria-hidden="true"
            />
            <input
              id="builder-pkg-input"
              type="text"
              value={pkgInput}
              onChange={(e) => {
                setPkgInput(e.target.value);
                if (e.target.value.trim() !== selectedPkg) {
                  setSelectedPkg('');
                  setVersions([]);
                  setSelectedVersion('');
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              spellCheck={false}
              autoComplete="off"
              placeholder={ecosystem === 'npm' ? 'e.g. axios, lodash, express' : 'e.g. requests, flask, pyyaml'}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#bdd6f4] bg-white text-[13.5px] font-mono text-[#0f172a] placeholder:font-sans placeholder:text-[#94a3b8] focus:border-[#0558d6] focus:outline-none focus:ring-2 focus:ring-[#0558d6]/15"
            />
            {searching && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0558d6] animate-spin"
                aria-hidden="true"
              />
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="Package suggestions"
              className="absolute z-30 mt-1.5 w-full rounded-xl border border-[#cde3fa] bg-white shadow-lg py-1 max-h-56 overflow-auto"
            >
              {suggestions.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item.name)}
                    className="w-full px-3 py-2 text-left hover:bg-[#eff6ff] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-[13px] font-medium text-[#0f172a] truncate">
                      {item.name}
                    </span>
                    {item.version && (
                      <span className="text-[11px] font-mono text-[#64748b] shrink-0">
                        v{item.version}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="builder-version-select"
            className="block text-[12.5px] font-medium text-[#334155] mb-1.5"
          >
            Version
          </label>
          <div className="relative">
            <select
              id="builder-version-select"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              disabled={loadingVersions || versions.length === 0}
              className="w-full h-10 px-3 rounded-xl border border-[#bdd6f4] bg-white text-[13px] font-mono text-[#0f172a] disabled:bg-[#f8fbff] disabled:text-[#94a3b8] focus:border-[#0558d6] focus:outline-none focus:ring-2 focus:ring-[#0558d6]/15"
            >
              {loadingVersions ? (
                <option value="">Loading versions...</option>
              ) : versions.length === 0 ? (
                <option value="">Select package first</option>
              ) : (
                versions.slice(0, 120).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loadingVersions || !pkgInput.trim()}
            className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#0558d6] bg-[#eff6ff] hover:bg-[#dbeafe] disabled:opacity-50 disabled:cursor-not-allowed text-[#0558d6] text-[13px] font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Step 3: Staged Packages Queue */}
      <div className="rounded-2xl border border-[#dce7f5] bg-[#f8fbff] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[#0f172a]">
            Packages to Scan{' '}
            <span className="ml-1 font-mono text-[12px] text-[#0558d6] tabular-nums">
              ({staged.length})
            </span>
          </p>
          {staged.length > 0 && (
            <button
              type="button"
              onClick={() => setStaged([])}
              className="text-[12px] text-[#64748b] hover:text-[#b82429] cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {staged.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-[#64748b] flex flex-col items-center gap-1.5">
            <PackageIcon className="h-5 w-5 text-[#94a3b8]" aria-hidden="true" />
            <span>No packages added yet. Search a package, pick a version, and click Add.</span>
          </div>
        ) : (
          <ul className="divide-y divide-[#e8eef7] rounded-xl border border-[#dce7f5] bg-white overflow-hidden">
            {staged.map((item) => (
              <li
                key={item.name}
                className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#0558d6] font-mono text-[10.5px] font-semibold uppercase">
                    {ecosystem}
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-[#0f172a] truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.availableVersions.length > 0 ? (
                    <select
                      aria-label={`Version for ${item.name}`}
                      value={item.version}
                      onChange={(e) => handleUpdateStagedVersion(item.name, e.target.value)}
                      className="h-8 px-2.5 rounded-lg border border-[#dce7f5] bg-[#f8fbff] font-mono text-[12px] text-[#0f172a] focus:border-[#0558d6] focus:outline-none"
                    >
                      {item.availableVersions.slice(0, 120).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-2 py-1 rounded-md bg-[#f1f6fd] font-mono text-[12px] text-[#334155]">
                      {item.version}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveStaged(item.name)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#b82429] hover:bg-[#feecee] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b82429]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      </div>

      <div className="flex justify-end pt-1">
        <KeycapButton
          type="button"
          variant="primary"
          size="md"
          disabled={staged.length === 0}
          onClick={handleScanClick}
          className="gap-2 w-full sm:w-auto"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>Scan {staged.length > 0 ? `${staged.length} Package${staged.length === 1 ? '' : 's'}` : 'Packages'}</span>
        </KeycapButton>
      </div>
    </div>
  );
}
