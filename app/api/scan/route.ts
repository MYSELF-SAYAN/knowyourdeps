import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '@/lib/cache';
import { Ecosystem } from '@/lib/types';

const OSV_QUERYBATCH_URL = 'https://api.osv.dev/v1/querybatch';
const OSV_VULN_URL = 'https://api.osv.dev/v1/vulns';

export interface ScanPackageInput {
  name: string;
  version: string;
  rawSpec?: string;
  section?: string;
}

export interface ScanCveItem {
  id: string;
  osvId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  url: string;
}

export interface ScanPackageResult {
  name: string;
  version: string;
  rawSpec?: string;
  section?: string;
  status: 'safe' | 'vulnerable';
  cves: ScanCveItem[];
}

interface OsvBatchVulnStub {
  id: string;
  modified?: string;
}

interface OsvVulnDetail {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  severity?: Array<{ type: string; score: string }>;
  database_specific?: { severity?: string };
}

function mapSeverity(detail: OsvVulnDetail): ScanCveItem['severity'] {
  const dbSev = detail.database_specific?.severity?.toUpperCase();
  if (dbSev === 'CRITICAL') return 'CRITICAL';
  if (dbSev === 'HIGH') return 'HIGH';
  if (dbSev === 'MODERATE' || dbSev === 'MEDIUM') return 'MEDIUM';
  if (dbSev === 'LOW') return 'LOW';

  const cvss = detail.severity?.[0]?.score;
  if (cvss) {
    const num = parseFloat(cvss);
    if (!Number.isNaN(num)) {
      if (num >= 9.0) return 'CRITICAL';
      if (num >= 7.0) return 'HIGH';
      if (num >= 4.0) return 'MEDIUM';
      return 'LOW';
    }
  }
  return 'MEDIUM';
}

async function fetchVulnDetail(osvId: string): Promise<ScanCveItem> {
  const cacheKey = `scan:osv:${osvId}`;
  const cached = getCached<ScanCveItem>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${OSV_VULN_URL}/${encodeURIComponent(osvId)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      throw new Error(`OSV ${res.status}`);
    }
    const detail = (await res.json()) as OsvVulnDetail;
    const cveAlias = detail.aliases?.find((a) => a.startsWith('CVE-'));
    const displayId = osvId.startsWith('CVE-') ? osvId : cveAlias || osvId;
    const rawSummary = detail.summary || detail.details || 'Security advisory reported in OSV.dev';
    const summary = rawSummary.length > 140 ? `${rawSummary.slice(0, 137)}...` : rawSummary;

    const item: ScanCveItem = {
      id: displayId,
      osvId,
      severity: mapSeverity(detail),
      summary,
      url: `https://osv.dev/vulnerability/${encodeURIComponent(osvId)}`,
    };
    setCached(cacheKey, item, 1000 * 60 * 30);
    return item;
  } catch {
    return {
      id: osvId,
      osvId,
      severity: 'MEDIUM',
      summary: 'Advisory reported by OSV.dev',
      url: `https://osv.dev/vulnerability/${encodeURIComponent(osvId)}`,
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function next() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current]);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(runners);
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      ecosystem?: Ecosystem;
      packages?: ScanPackageInput[];
    };

    const ecosystem: Ecosystem = body.ecosystem === 'pypi' ? 'pypi' : 'npm';
    const packages = Array.isArray(body.packages) ? body.packages.slice(0, 300) : [];

    if (packages.length === 0) {
      return NextResponse.json(
        { error: 'No dependencies were found to scan.' },
        { status: 400 }
      );
    }

    const osvEcosystem = ecosystem === 'npm' ? 'npm' : 'PyPI';

    // Query OSV.dev querybatch in chunks of 100
    const batchResults: Array<{ vulns?: OsvBatchVulnStub[] }> = [];
    const CHUNK_SIZE = 100;

    for (let i = 0; i < packages.length; i += CHUNK_SIZE) {
      const chunk = packages.slice(i, i + CHUNK_SIZE);
      const queries = chunk.map((pkg) => {
        const hasConcreteVersion =
          pkg.version && pkg.version !== 'unpinned' && pkg.version !== 'latest';
        return {
          package: {
            name: pkg.name,
            ecosystem: osvEcosystem,
          },
          ...(hasConcreteVersion ? { version: pkg.version } : {}),
        };
      });

      const res = await fetch(OSV_QUERYBATCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `OSV.dev batch lookup failed (${res.status}). Please try again.` },
          { status: 502 }
        );
      }

      const data = (await res.json()) as { results?: Array<{ vulns?: OsvBatchVulnStub[] }> };
      const chunkResults = data.results || [];
      for (let j = 0; j < chunk.length; j++) {
        batchResults.push(chunkResults[j] || { vulns: [] });
      }
    }

    // Collect unique OSV IDs to resolve CVE aliases & severities
    const uniqueOsvIds = new Set<string>();
    for (const r of batchResults) {
      for (const v of r.vulns || []) {
        if (v.id) uniqueOsvIds.add(v.id);
      }
    }

    const detailMap = new Map<string, ScanCveItem>();
    if (uniqueOsvIds.size > 0) {
      const ids = Array.from(uniqueOsvIds);
      const details = await mapWithConcurrency(ids, 10, fetchVulnDetail);
      for (const d of details) {
        detailMap.set(d.osvId, d);
      }
    }

    const results: ScanPackageResult[] = packages.map((pkg, idx) => {
      const stubs = batchResults[idx]?.vulns || [];
      const seenIds = new Set<string>();
      const cves: ScanCveItem[] = [];

      for (const stub of stubs) {
        const detail = detailMap.get(stub.id);
        if (!detail) continue;
        if (seenIds.has(detail.id)) continue;
        seenIds.add(detail.id);
        cves.push(detail);
      }

      return {
        name: pkg.name,
        version: pkg.version || 'unpinned',
        rawSpec: pkg.rawSpec,
        section: pkg.section,
        status: cves.length === 0 ? 'safe' : 'vulnerable',
        cves,
      };
    });

    const vulnerableCount = results.filter((r) => r.status === 'vulnerable').length;
    const safeCount = results.length - vulnerableCount;
    const totalCves = results.reduce((acc, r) => acc + r.cves.length, 0);

    return NextResponse.json({
      ecosystem,
      results,
      summary: {
        total: results.length,
        safe: safeCount,
        vulnerable: vulnerableCount,
        totalCves,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error while scanning dependencies.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
