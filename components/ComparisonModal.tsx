'use client';

import React, { useState, useEffect } from 'react';
import { Ecosystem, PackageOverview, SecurityData, DependencyData } from '@/lib/types';
import { X, Plus, Scale, ShieldCheck, ShieldAlert, Download, Layers, Scale as ScaleIcon, ArrowUpRight, Trash2, RefreshCw } from 'lucide-react';
import { Badge } from './ui/Badge';
import { KeycapButton } from './ui/KeycapButton';
import Link from 'next/link';

interface ComparisonItem {
  overview: PackageOverview;
  security: SecurityData;
  deps: DependencyData;
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackages: { ecosystem: Ecosystem; name: string }[];
}

export function ComparisonModal({ isOpen, onClose, initialPackages }: ComparisonModalProps) {
  const [packageList, setPackageList] = useState<{ ecosystem: Ecosystem; name: string }[]>(initialPackages);
  const [data, setData] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgEcosystem, setNewPkgEcosystem] = useState<Ecosystem>('npm');
  const [error, setError] = useState<string | null>(null);

  // Sync initial packages
  useEffect(() => {
    if (initialPackages.length > 0) {
      setPackageList(initialPackages);
    }
  }, [initialPackages]);

  // Fetch comparison data when package list changes
  useEffect(() => {
    if (!isOpen || packageList.length === 0) return;

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: packageList }),
        });
        if (!res.ok) throw new Error('Failed to run package comparison');
        const json = await res.json();
        setData(json.results || []);
      } catch (err: any) {
        setError(err.message || 'Comparison request failed');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [isOpen, packageList]);

  if (!isOpen) return null;

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;
    if (packageList.length >= 4) {
      setError('You can compare at most 4 packages simultaneously');
      return;
    }
    const exists = packageList.some(
      (p) => p.name.toLowerCase() === newPkgName.trim().toLowerCase() && p.ecosystem === newPkgEcosystem
    );
    if (exists) {
      setError('Package is already in the comparison table');
      return;
    }

    setPackageList([...packageList, { ecosystem: newPkgEcosystem, name: newPkgName.trim() }]);
    setNewPkgName('');
    setError(null);
  };

  const handleRemovePackage = (index: number) => {
    const updated = packageList.filter((_, i) => i !== index);
    setPackageList(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#e8e8e8] rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#0033ff]/10 text-[#0033ff] flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[18px] text-[#1a1a1a]">
                Side-by-Side Package Matrix
              </h3>
              <p className="text-[12px] text-[#8c8c8c]">
                Compare velocity, supply chain security, and footprint across up to 4 packages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e8e8e8] flex items-center justify-center text-[#6e6e6e] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add Package Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-[#f0f0f0]">
          <form onSubmit={handleAddPackage} className="flex flex-wrap items-center gap-2">
            <select
              value={newPkgEcosystem}
              onChange={(e) => setNewPkgEcosystem(e.target.value as Ecosystem)}
              className="text-[12px] bg-[#f8f8f8] border border-[#e8e8e8] rounded-[8px] px-3 py-1.5 font-medium text-[#1a1a1a] focus:outline-none focus:border-[#0033ff]"
            >
              <option value="npm">npm</option>
              <option value="pypi">PyPI</option>
            </select>

            <input
              type="text"
              value={newPkgName}
              onChange={(e) => setNewPkgName(e.target.value)}
              placeholder="Add package to compare (e.g. ky, got, urllib3)..."
              disabled={packageList.length >= 4}
              className="flex-1 min-w-[200px] text-[12px] bg-[#f8f8f8] border border-[#e8e8e8] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0033ff] focus:bg-white transition-colors"
            />

            <KeycapButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={packageList.length >= 4 || !newPkgName.trim() || loading}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </KeycapButton>

            {loading && <RefreshCw className="h-4 w-4 animate-spin text-[#0033ff] ml-2" />}
          </form>

          {error && <p className="text-[12px] text-[#e5484d] mt-2 font-medium">{error}</p>}
        </div>

        {/* Comparison Matrix Table */}
        <div className="flex-1 overflow-auto p-6">
          {data.length === 0 && !loading && (
            <div className="p-12 text-center text-[#8c8c8c] text-[14px]">
              No packages selected. Add packages above to generate the comparative matrix.
            </div>
          )}

          {data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.map((item, idx) => (
                <div
                  key={`${item.overview.name}-${idx}`}
                  className="bg-[#fbfbfb] border border-[#e8e8e8] rounded-[18px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="primary" size="sm">
                        {item.overview.ecosystem.toUpperCase()}
                      </Badge>
                      <button
                        onClick={() => handleRemovePackage(idx)}
                        className="text-[#a6a6a6] hover:text-[#e5484d] transition-colors p-1"
                        title="Remove package"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2">
                      <Link
                        href={`/?ecosystem=${item.overview.ecosystem}&package=${encodeURIComponent(item.overview.name)}&type=overview`}
                        onClick={onClose}
                        className="font-mono text-[16px] font-bold text-[#1a1a1a] hover:text-[#0033ff] transition-colors inline-flex items-center gap-1 group"
                      >
                        <span className="truncate">{item.overview.name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <span className="block font-mono text-[12px] text-[#6e6e6e]">
                        v{item.overview.latestVersion}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6e6e6e] mt-2 line-clamp-2 leading-relaxed">
                      {item.overview.description || 'No description provided.'}
                    </p>

                    {/* Matrix Metrics */}
                    <div className="mt-4 space-y-2.5 text-[12px] border-t border-[#ebebeb] pt-3">
                      {/* Weekly Downloads */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#8c8c8c] flex items-center gap-1">
                          <Download className="h-3 w-3" /> Downloads
                        </span>
                        <span className="font-mono font-bold text-[#1a1a1a] tabular-nums">
                          {item.overview.totalDownloadsWeekly
                            ? item.overview.totalDownloadsWeekly.toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>

                      {/* Security Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#8c8c8c] flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Security
                        </span>
                        {item.overview.securityStatus === 'safe' ? (
                          <Badge variant="success" size="sm">
                            0 Vulnerabilities
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            {item.overview.vulnerabilitiesCount} Advisories
                          </Badge>
                        )}
                      </div>

                      {/* Dependencies */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#8c8c8c] flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Direct Deps
                        </span>
                        <span className="font-mono font-bold text-[#1a1a1a]">
                          {item.deps?.totalDirect ?? item.overview.dependenciesCount ?? 0}
                        </span>
                      </div>

                      {/* License */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#8c8c8c]">License</span>
                        <Badge variant="default" size="sm">
                          {item.overview.license}
                        </Badge>
                      </div>

                      {/* Published */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#8c8c8c]">Last Release</span>
                        <span className="text-[#4a4a4a] text-[11px]">
                          {item.overview.publishedAt ? new Date(item.overview.publishedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action link */}
                  <div className="mt-4 pt-3 border-t border-[#ebebeb]">
                    <Link
                      href={`/?ecosystem=${item.overview.ecosystem}&package=${encodeURIComponent(item.overview.name)}&type=overview`}
                      onClick={onClose}
                      className="w-full text-center block py-1.5 bg-white border border-[#e8e8e8] rounded-[8px] text-[12px] font-semibold text-[#1a1a1a] hover:border-[#0033ff] hover:text-[#0033ff] transition-colors"
                    >
                      Deep Dive
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between">
          <span className="text-[12px] text-[#8c8c8c]">
            {data.length} of 4 slots used
          </span>
          <KeycapButton variant="secondary" size="sm" onClick={onClose}>
            Close Matrix
          </KeycapButton>
        </div>
      </div>
    </div>
  );
}
