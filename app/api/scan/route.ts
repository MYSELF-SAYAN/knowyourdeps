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
  status: 'safe' | 'vulnerable' | 'invalid';
  cves: ScanCveItem[];
  invalidReason?: string;
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

async function verifyPackageExists(
  ecosystem: Ecosystem,
  name: string,
  version: string
): Promise<{ valid: boolean; reason?: string }> {
  const hasConcreteVersion =
    Boolean(version) && version !== 'unpinned' && version !== 'latest';
  const cacheKey = `scan:exists:${ecosystem}:${name.toLowerCase()}:${hasConcreteVersion ? version : 'any'}`;
  const cached = getCached<{ valid: boolean; reason?: string }>(cacheKey);
  if (cached) return cached;

  try {
    if (ecosystem === 'npm') {
      const res = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(name)}`,
        {
          headers: { Accept: 'application/vnd.npm.install-v1+json' },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (res.status === 404) {
        const out = { valid: false, reason: 'Package not found on npm' };
        setCached(cacheKey, out, 1000 * 60 * 30);
        return out;
      }
      if (!res.ok) {
        return { valid: true };
      }
      if (hasConcreteVersion) {
        const data = (await res.json()) as { versions?: Record<string, unknown> };
        if (data.versions && !(version in data.versions)) {
          const out = { valid: false, reason: `Version ${version} not found on npm` };
          setCached(cacheKey, out, 1000 * 60 * 30);
          return out;
        }
      }
      const out = { valid: true };
      setCached(cacheKey, out, 1000 * 60 * 30);
      return out;
    } else {
      const url = hasConcreteVersion
        ? `https://pypi.org/pypi/${encodeURIComponent(name)}/${encodeURIComponent(version)}/json`
        : `https://pypi.org/pypi/${encodeURIComponent(name)}/json`;
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(6000),
      });
      if (res.status === 404) {
        const out = {
          valid: false,
          reason: hasConcreteVersion
            ? `Package or version ${version} not found on PyPI`
            : 'Package not found on PyPI',
        };
        setCached(cacheKey, out, 1000 * 60 * 30);
        return out;
      }
      const out = { valid: true };
      setCached(cacheKey, out, 1000 * 60 * 30);
      return out;
    }
  } catch {
    return { valid: true };
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

    // Verify packages actually exist in npm / PyPI before scanning CVEs
    const existenceChecks = await mapWithConcurrency(packages, 10, (pkg) =>
      verifyPackageExists(ecosystem, pkg.name, pkg.version)
    );

    const validEntries = packages
      .map((pkg, idx) => ({ pkg, idx, check: existenceChecks[idx] }))
      .filter((entry) => entry.check.valid);

    if (validEntries.length === 0) {
      const sample = packages[0]?.name || 'package';
      return NextResponse.json(
        {
          error: `No valid ${ecosystem === 'npm' ? 'npm' : 'PyPI'} dependencies found ("${sample}" does not exist in the registry).`,
        },
        { status: 400 }
      );
    }

    // Query OSV.dev querybatch in chunks of 100 for valid packages only
    const validBatchMap = new Map<number, { vulns?: OsvBatchVulnStub[] }>();
    const CHUNK_SIZE = 100;

    for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
      const chunk = validEntries.slice(i, i + CHUNK_SIZE);
      const queries = chunk.map(({ pkg }) => {
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
        validBatchMap.set(chunk[j].idx, chunkResults[j] || { vulns: [] });
      }
    }

    // Collect unique OSV IDs to resolve CVE aliases & severities
    const uniqueOsvIds = new Set<string>();
    for (const r of validBatchMap.values()) {
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
      const check = existenceChecks[idx];
      if (!check.valid) {
        return {
          name: pkg.name,
          version: pkg.version || 'unpinned',
          rawSpec: pkg.rawSpec,
          section: pkg.section,
          status: 'invalid',
          cves: [],
          invalidReason: check.reason || 'Not found in registry',
        };
      }

      const stubs = validBatchMap.get(idx)?.vulns || [];
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
    const safeCount = results.filter((r) => r.status === 'safe').length;
    const totalCves = results.reduce((acc, r) => acc + r.cves.length, 0);

    return NextResponse.json({
      ecosystem,
      results,
      summary: {
        total: validEntries.length,
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
