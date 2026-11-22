import { getCached, setCached } from '../cache';
import { Ecosystem, DependencyData, SecurityData, SecurityAdvisory } from '../types';

const DEPS_DEV_BASE = process.env.DEPS_DEV_API_BASE_URL || 'https://api.deps.dev/v3';

function toSystem(ecosystem: Ecosystem): string {
  return ecosystem === 'npm' ? 'NPM' : 'PYPI';
}

export async function getDepsDevVersion(ecosystem: Ecosystem, name: string, version: string) {
  const sys = toSystem(ecosystem);
  const cacheKey = `depsdev:ver:${sys}:${name}:${version}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  try {
    const encName = encodeURIComponent(name);
    const encVer = encodeURIComponent(version);
    const res = await fetch(`${DEPS_DEV_BASE}/systems/${sys}/packages/${encName}/versions/${encVer}`, {
      headers: { 'User-Agent': 'PackagePulse/1.0.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    setCached(cacheKey, data, 600);
    return data;
  } catch {
    return null;
  }
}

export async function getDepsDevDependencies(ecosystem: Ecosystem, name: string, version: string): Promise<DependencyData> {
  const sys = toSystem(ecosystem);
  const cacheKey = `depsdev:deps:${sys}:${name}:${version}`;
  const cached = getCached<DependencyData>(cacheKey);
  if (cached) return cached;

  const encName = encodeURIComponent(name);
  const encVer = encodeURIComponent(version);

  let requirements: any[] = [];
  let resolvedGraph: any[] = [];

  // 1. Requirements
  try {
    const reqRes = await fetch(`${DEPS_DEV_BASE}/systems/${sys}/packages/${encName}/versions/${encVer}:requirements`);
    if (reqRes.ok) {
      const data = await reqRes.json();
      requirements = (data.requirements || []).map((r: any) => ({
        name: r.packageKey?.name || 'unknown',
        constraint: r.requirement || '*',
        ecosystem,
      }));
    }
  } catch {
    // best effort
  }

  // 2. Resolved Dependencies
  try {
    const depRes = await fetch(`${DEPS_DEV_BASE}/systems/${sys}/packages/${encName}/versions/${encVer}:dependencies`);
    if (depRes.ok) {
      const data = await depRes.json();
      // data.nodes is array of { versionKey: { name, version }, relation: "DIRECT" | "INDIRECT", errors }
      resolvedGraph = (data.nodes || []).map((n: any) => ({
        name: n.versionKey?.name || '',
        version: n.versionKey?.version || '',
        relation: n.relation || 'UNKNOWN',
        errors: n.errors || [],
      }));
    }
  } catch {
    // best effort
  }

  const result: DependencyData = {
    requirements,
    resolvedGraph,
    totalDirect: requirements.length,
    totalTransitive: resolvedGraph.filter(n => n.relation === 'INDIRECT').length,
    ecosystem,
    version,
    source: 'deps.dev API v3',
    note: 'Resolved dependency graphs represent generic environment approximations.',
  };

  setCached(cacheKey, result, 600);
  return result;
}

export async function getDepsDevSecurity(ecosystem: Ecosystem, name: string, version: string): Promise<SecurityData> {
  const sys = toSystem(ecosystem);
  const cacheKey = `depsdev:sec:${sys}:${name}:${version}`;
  const cached = getCached<SecurityData>(cacheKey);
  if (cached) return cached;

  const verData = await getDepsDevVersion(ecosystem, name, version);
  const advisoryKeys = verData?.advisoryKeys || [];

  if (!advisoryKeys.length) {
    const safeData: SecurityData = {
      status: 'safe',
      summaryMessage: 'No known vulnerabilities found in checked sources (deps.dev / OSV)',
      advisories: [],
      checkedVersion: version,
      source: 'deps.dev API v3',
    };
    setCached(cacheKey, safeData, 600);
    return safeData;
  }

  // Fetch individual advisories
  const advisories: SecurityAdvisory[] = [];
  for (const key of advisoryKeys.slice(0, 10)) {
    const advId = key.id;
    try {
      const advRes = await fetch(`${DEPS_DEV_BASE}/advisories/${advId}`);
      if (advRes.ok) {
        const a = await advRes.json();
        let sev: SecurityAdvisory['severity'] = 'UNKNOWN';
        if (a.severity === 'CRITICAL' || a.severity === 'HIGH' || a.severity === 'MEDIUM' || a.severity === 'LOW') {
          sev = a.severity;
        }

        advisories.push({
          id: advId,
          title: a.title || advId,
          aliases: a.aliases || [],
          severity: sev,
          cvssScore: a.cvss3Score,
          cwe: a.cweIds?.[0],
          affectedRange: '',
          publishedAt: a.discovered || '',
          summary: a.description || a.title || '',
          sourceUrl: a.sourceUrl || `https://osv.dev/vulnerability/${advId}`,
        });
      }
    } catch {
      // skip
    }
  }

  const secData: SecurityData = {
    status: advisories.length ? 'vulnerable' : 'safe',
    summaryMessage: advisories.length
      ? `${advisories.length} known security advisory records found for version ${version}`
      : 'No known vulnerabilities found in checked sources',
    advisories,
    checkedVersion: version,
    source: 'deps.dev API v3 / OSV.dev',
  };

  setCached(cacheKey, secData, 600);
  return secData;
}
