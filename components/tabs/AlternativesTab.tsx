'use client';

import React, { useEffect, useState } from 'react';
import { Ecosystem, AlternativePackage } from '@/lib/types';
import { Shuffle, AlertTriangle, ArrowRight, Star, Download, ShieldAlert, Sparkles, Scale } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { KeycapButton } from '../ui/KeycapButton';
import Link from 'next/link';

interface AlternativesTabProps {
  ecosystem: Ecosystem;
  packageName: string;
  onCompareWith?: (targetPackage: string) => void;
}

export function AlternativesTab({ ecosystem, packageName, onCompareWith }: AlternativesTabProps) {
  const [alternatives, setAlternatives] = useState<AlternativePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlternatives = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/package/alternatives?ecosystem=${ecosystem}&name=${encodeURIComponent(packageName)}`
        );
        if (!res.ok) throw new Error('Failed to load alternative recommendations');
        const json = await res.json();
        setAlternatives(Array.isArray(json) ? json : json.alternatives || []);
      } catch (err: any) {
        setError(err.message || 'Error loading alternatives');
      } finally {
        setLoading(false);
      }
    };

    fetchAlternatives();
  }, [ecosystem, packageName]);

  const functionalAlternatives = alternatives.filter((a) => a.matchType === 'functional');
  const typosquats = alternatives.filter((a) => a.matchType === 'name-similar');

  return (
    <div className="flex flex-col gap-6">
      {/* Intro Header */}
      <div className="bg-white border border-[#e8e8e8] rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-[#0033ff]" />
            <h3 className="font-sans font-bold text-[18px] text-[#1a1a1a]">
              Alternatives & Ecosystem Counterparts
            </h3>
          </div>
          <p className="text-[13px] text-[#6e6e6e] mt-1 max-w-[560px]">
            Comparative alternatives to <span className="font-mono font-medium text-[#1a1a1a]">{packageName}</span> curated for security, performance, maintenance velocity, and bundle footprint.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-[#8c8c8c]">
          <span>{functionalAlternatives.length} recommended</span>
          {typosquats.length > 0 && <span>• {typosquats.length} typosquat warnings</span>}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#f4f4f4] rounded-[16px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 bg-[#feecee] border border-[#fcccd1] rounded-[16px] text-[#e5484d] flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[14px]">Unable to load alternatives</p>
            <p className="text-[12px] opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Typosquatting / Name-similar Security Warning Banner */}
      {typosquats.length > 0 && !loading && (
        <div className="bg-[#fff8eb] border border-[#fed59b] rounded-[18px] p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-[#f76808] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-sans font-bold text-[15px] text-[#78350f]">
                Typosquat & Confusingly Similar Names Detected
              </h4>
              <p className="text-[12px] text-[#92400e] mt-1 leading-relaxed">
                The following packages have names almost identical to <strong className="font-mono">{packageName}</strong> (Levenshtein distance ≤ 2). Always verify exact package spelling in your package.json / requirements.txt to prevent malicious supply chain attacks.
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {typosquats.map((typo) => (
                  <div
                    key={typo.name}
                    className="bg-white/80 border border-[#fed59b] rounded-[10px] p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-[13px] font-bold text-[#b45309]">
                        {typo.name}
                      </span>
                      <span className="block text-[10px] text-[#8c8c8c]">{typo.reason}</span>
                    </div>
                    <Link
                      href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(typo.name)}&type=overview`}
                      className="text-[11px] text-[#0033ff] hover:underline font-medium"
                    >
                      Audit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Functional Alternatives Grid */}
      {!loading && functionalAlternatives.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="font-sans font-bold text-[16px] text-[#1a1a1a] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0033ff]" />
            Curated Functional Alternatives
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {functionalAlternatives.map((alt) => (
              <div
                key={alt.name}
                className="bg-white border border-[#e8e8e8] rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#c7d3ff] hover:shadow-[0_4px_16px_rgba(0,51,255,0.06)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(alt.name)}&type=overview`}
                          className="font-mono text-[16px] font-bold text-[#1a1a1a] hover:text-[#0033ff] transition-colors"
                        >
                          {alt.name}
                        </Link>
                        <Badge variant="primary" size="sm">
                          v{alt.latestVersion}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-[#6e6e6e] mt-1.5 line-clamp-2 leading-relaxed">
                        {alt.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Reason Pill */}
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-[#f5f7ff] border border-[#d6e0ff] text-[#0033ff] px-2.5 py-1 rounded-[8px] text-[11px] font-medium">
                    <Sparkles className="h-3 w-3" />
                    <span>{alt.reason}</span>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#f0f0f0] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[12px] text-[#6e6e6e]">
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-[#8c8c8c]" />
                      <span className="font-mono font-semibold text-[#1a1a1a] tabular-nums">
                        {alt.weeklyDownloads ? alt.weeklyDownloads.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-[10px] text-[#8c8c8c]">/wk</span>
                    </div>

                    {alt.stars !== undefined && alt.stars > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-[#8c8c8c]" />
                        <span className="font-mono font-semibold text-[#1a1a1a] tabular-nums">
                          {alt.stars.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onCompareWith && (
                      <KeycapButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onCompareWith(alt.name)}
                        className="text-[11px]"
                      >
                        <Scale className="h-3 w-3 mr-1" />
                        Compare
                      </KeycapButton>
                    )}
                    <Link
                      href={`/?ecosystem=${ecosystem}&package=${encodeURIComponent(alt.name)}&type=overview`}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0033ff] hover:underline"
                    >
                      Inspect <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && functionalAlternatives.length === 0 && typosquats.length === 0 && (
        <div className="bg-white border border-[#e8e8e8] rounded-[20px] p-8 text-center flex flex-col items-center justify-center">
          <Shuffle className="h-8 w-8 text-[#8c8c8c] mb-2" />
          <h4 className="font-sans font-bold text-[16px] text-[#1a1a1a]">No Direct Alternatives Found</h4>
          <p className="text-[13px] text-[#6e6e6e] max-w-[400px] mt-1">
            We haven't indexed specific drop-in alternatives for this package yet. Try searching for related packages with the search bar above.
          </p>
        </div>
      )}
    </div>
  );
}
