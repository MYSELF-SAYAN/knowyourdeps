import { getCached, setCached } from '../cache';
import { Ecosystem, SecurityData, SecurityAdvisory } from '../types';

const OSV_API_BASE = 'https://api.osv.dev/v1/query';
const OSV_VULN_BASE = 'https://api.osv.dev/v1/vulns';
const DEPS_DEV_BASE = 'https://api.deps.dev/v3';

function toOsvEcosystem(ecosystem: Ecosystem): string {
  return ecosystem === 'npm' ? 'npm' : 'PyPI';
}

function parseFixedVersion(affectedList: any[] = []): string | undefined {
  for (const item of affectedList) {
    for (const range of item.ranges || []) {
      for (const event of range.events || []) {
        if (event.fixed) {
          return event.fixed;
        }
      }
    }
  }
  return undefined;
}

function parseAffectedRange(affectedList: any[] = []): string {
  const parts: string[] = [];
  for (const item of affectedList) {
    for (const range of item.ranges || []) {
      let introduced = '';
      let fixed = '';
      for (const event of range.events || []) {
        if (event.introduced && event.introduced !== '0') introduced = `>= ${event.introduced}`;
        if (event.fixed) fixed = `< ${event.fixed}`;
      }
      if (introduced && fixed) parts.push(`${introduced}, ${fixed}`);
      else if (fixed) parts.push(fixed);
      else if (introduced) parts.push(introduced);
    }
  }
  return parts.length > 0 ? parts.join(' | ') : 'All prior versions';
}

function mapOsvSeverity(sevStr?: string, cvssScore?: number): SecurityAdvisory['severity'] {
  if (sevStr) {
    const s = sevStr.toUpperCase();
    if (s.includes('CRITICAL')) return 'CRITICAL';
    if (s.includes('HIGH')) return 'HIGH';
    if (s.includes('MODERATE') || s.includes('MEDIUM')) return 'MEDIUM';
    if (s.includes('LOW')) return 'LOW';
  }
  if (cvssScore !== undefined && cvssScore > 0) {
    if (cvssScore >= 9.0) return 'CRITICAL';
    if (cvssScore >= 7.0) return 'HIGH';
    if (cvssScore >= 4.0) return 'MEDIUM';
    return 'LOW';
  }
  return 'MEDIUM';
}

function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => (v || '').replace(/^v/, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const p1 = clean(v1);
  const p2 = clean(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 !== num2) return num1 - num2;
  }
  return 0;
}

function isVersionInAffectedRange(targetVer: string, affectedList: any[] = []): boolean {
  if (!targetVer || targetVer === 'latest') return false;
  for (const item of affectedList) {
    if (Array.isArray(item.versions) && item.versions.includes(targetVer)) {
      return true;
    }
    for (const range of item.ranges || []) {
      let introduced = '';
      let fixed = '';
      for (const event of range.events || []) {
        if (event.introduced) introduced = event.introduced;
        if (event.fixed) fixed = event.fixed;
      }
      const introOk = !introduced || introduced === '0' || compareSemver(targetVer, introduced) >= 0;
      const fixedOk = !fixed || compareSemver(targetVer, fixed) < 0;
      if (introOk && fixedOk) {
        return true;
      }
    }
  }
  return false;
}

function isSemverInRange(ver: string, rangeStr?: string): boolean {
  if (!rangeStr || !ver || ver === 'latest') return false;
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const match = part.match(/^([><]=?|=)\s*([0-9a-zA-Z.-]+)/);
    if (!match) continue;
    const op = match[1];
    const target = match[2];
    const cmp = compareSemver(ver, target);
    if (op === '>' && !(cmp > 0)) return false;
    if (op === '>=' && !(cmp >= 0)) return false;
    if (op === '<' && !(cmp < 0)) return false;
    if (op === '<=' && !(cmp <= 0)) return false;
    if (op === '=' && !(cmp === 0)) return false;
  }
  return true;
}

function parseGitHubOwnerRepo(urlOrString?: string): { owner: string; repo: string } | null {
  if (!urlOrString) return null;
  const match = urlOrString.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }
  return null;
}

async function getPackageRepository(packageName: string, ecosystem: Ecosystem): Promise<string | undefined> {
  const cacheKey = `pkg:repo:${ecosystem}:${packageName}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    if (ecosystem === 'npm') {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
        headers: { 'User-Agent': 'KnowYourDeps/1.0' },
        next: { revalidate: 600 },
      });
      if (res.ok) {
        const d = await res.json();
        const latest = d['dist-tags']?.latest;
        const verObj = latest && d.versions?.[latest] ? d.versions[latest] : {};
        let repo = '';
        if (typeof verObj.repository === 'string') repo = verObj.repository;
        else if (verObj.repository?.url) repo = verObj.repository.url;
        else if (typeof d.repository === 'string') repo = d.repository;
        else if (d.repository?.url) repo = d.repository.url;
        if (repo) {
          setCached(cacheKey, repo, 600);
          return repo;
        }
      }
    } else {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`, {
        next: { revalidate: 600 },
      });
      if (res.ok) {
        const d = await res.json();
        const urls = d.info?.project_urls || {};
        for (const k of Object.keys(urls)) {
          if (urls[k] && urls[k].includes('github.com')) {
            setCached(cacheKey, urls[k], 600);
            return urls[k];
          }
        }
      }
    }
  } catch {
    // best effort
  }
  return undefined;
}

async function getGitHubSecurityAdvisories(owner: string, repo: string): Promise<any[]> {
  const cacheKey = `gh:advisories:${owner}:${repo}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/security-advisories`, {
      headers: {
        'User-Agent': 'KnowYourDeps-SecurityAudit/1.0',
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      setCached(cacheKey, data, 300);
      return data;
    }
  } catch {
    // best effort
  }
  return [];
}

// Identify parent/core ecosystem packages that share vulnerability histories
function getParentEcosystemPackages(name: string, ecosystem: Ecosystem): string[] {
  const lower = name.toLowerCase();
  const parents: string[] = [];

  if (ecosystem === 'pypi') {
    if (lower.startsWith('langchain-')) {
      parents.push('langchain', 'langchain-core', 'langchain-community');
    } else if (lower.startsWith('django-')) {
      parents.push('django');
    } else if (lower.startsWith('flask-')) {
      parents.push('flask');
    } else if (lower.startsWith('fastapi-')) {
      parents.push('fastapi');
    } else if (lower.startsWith('pytest-')) {
      parents.push('pytest');
    }
  } else {
    // npm
    if (lower.startsWith('@')) {
      const scope = lower.split('/')[0];
      if (scope === '@angular') parents.push('@angular/core');
      if (scope === '@babel') parents.push('@babel/core');
      if (scope === '@nestjs') parents.push('@nestjs/core');
    } else if (lower.startsWith('react-')) {
      parents.push('react');
    }
  }

  return parents.filter(p => p !== lower);
}

// Fetch direct dependencies for supply chain auditing
async function getDirectDependencies(name: string, version: string, ecosystem: Ecosystem): Promise<string[]> {
  try {
    if (ecosystem === 'pypi') {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/${encodeURIComponent(version)}/json`);
      if (res.ok) {
        const d = await res.json();
        const requiresDist: string[] = d.info?.requires_dist || [];
        return requiresDist
          .map(r => r.split(/[<>=~;! \[\]]/)[0].trim())
          .filter(Boolean)
          .slice(0, 8); // Top 8 direct dependencies
      }
    } else {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`);
      if (res.ok) {
        const d = await res.json();
        const deps = Object.keys(d.dependencies || {});
        return deps.slice(0, 8);
      }
    }
  } catch {
    // best effort
  }
  return [];
}

export async function lookupDirectCve(cveId: string): Promise<SecurityAdvisory | null> {
  const cleanId = cveId.trim().toUpperCase();
  try {
    const res = await fetch(`${OSV_VULN_BASE}/${encodeURIComponent(cleanId)}`);
    if (!res.ok) return null;
    const v = await res.json();
    const primaryId = v.id || cleanId;
    const aliases: string[] = v.aliases || [];
    const cve = aliases.find((a: string) => a.startsWith('CVE-')) || (primaryId.startsWith('CVE-') ? primaryId : undefined);
    const ghsa = primaryId.startsWith('GHSA-') ? primaryId : aliases.find((a: string) => a.startsWith('GHSA-'));

    return {
      id: primaryId,
      title: v.summary || `Vulnerability Record ${primaryId}`,
      aliases,
      severity: mapOsvSeverity(v.database_specific?.severity),
      affectedRange: parseAffectedRange(v.affected),
      fixedVersion: parseFixedVersion(v.affected),
      publishedAt: v.published || v.modified || '',
      summary: v.summary || v.details || 'Vulnerability details from OSV / NVD.',
      details: v.details,
      sourceUrl: ghsa ? `https://github.com/advisories/${ghsa}` : `https://osv.dev/vulnerability/${primaryId}`,
      nvdUrl: cve ? `https://nvd.nist.gov/vuln/detail/${cve}` : undefined,
      githubUrl: ghsa ? `https://github.com/advisories/${ghsa}` : undefined,
      affectsSelectedVersion: true,
      component: cleanId,
      componentType: 'direct',
    };
  } catch {
    return null;
  }
}

export async function getPackageSecurity(
  ecosystem: Ecosystem,
  packageName: string,
  version: string
): Promise<SecurityData> {
  const cacheKey = `security:comprehensive:${ecosystem}:${packageName}:${version}`;
  const cached = getCached<SecurityData>(cacheKey);
  if (cached) return cached;

  const osvSys = toOsvEcosystem(ecosystem);
  const auditedComponents: { name: string; type: 'direct' | 'parent-ecosystem' | 'dependency'; count: number }[] = [];
  const rawAdvisories: any[] = [];
  const activeIds = new Set<string>();
  const seenIds = new Set<string>();

  // 1. Direct Package Vulnerabilities
  try {
    // Specific version active vulnerabilities
    const verRes = await fetch(OSV_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: packageName, ecosystem: osvSys },
        version: version !== 'latest' ? version : undefined,
      }),
      next: { revalidate: 300 },
    });
    if (verRes.ok) {
      const data = await verRes.json();
      for (const v of data.vulns || []) {
        activeIds.add(v.id);
      }
    }

    // All package historical vulnerabilities
    const allRes = await fetch(OSV_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: packageName, ecosystem: osvSys },
      }),
      next: { revalidate: 300 },
    });
    let directCount = 0;
    if (allRes.ok) {
      const data = await allRes.json();
      const vulns = data.vulns || [];
      directCount = vulns.length;
      for (const v of vulns) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          rawAdvisories.push({ ...v, component: packageName, componentType: 'direct' });
        }
      }
    }
    auditedComponents.push({ name: packageName, type: 'direct', count: directCount });
  } catch (err) {
    console.error('OSV direct query error:', err);
  }

  // 1b. Ingest GitHub Repository Advisories (catches newly minted repository advisories like CVE-2026-133867)
  try {
    const repoUrl = await getPackageRepository(packageName, ecosystem);
    const ghRepo = parseGitHubOwnerRepo(repoUrl);
    if (ghRepo) {
      const ghAdvisories = await getGitHubSecurityAdvisories(ghRepo.owner, ghRepo.repo);
      for (const ghAdv of ghAdvisories) {
        const ghsaId = ghAdv.ghsa_id;
        const cveId = ghAdv.cve_id;
        const primaryId = ghsaId || cveId;
        if (!primaryId) continue;

        const aliases = Array.from(new Set([ghsaId, cveId].filter(Boolean) as string[]));

        // Find relevant package vulnerability slice
        const relVulns = Array.isArray(ghAdv.vulnerabilities)
          ? ghAdv.vulnerabilities.filter((v: any) => {
              if (!v.package?.name) return true;
              const vName = v.package.name.toLowerCase();
              const pName = packageName.toLowerCase();
              return vName === pName || vName.endsWith(`/${pName}`) || pName.endsWith(`/${vName}`);
            })
          : [];

        const vulnItem = relVulns[0] || (ghAdv.vulnerabilities && ghAdv.vulnerabilities[0]);
        const affectedRange = vulnItem?.vulnerable_version_range || '';
        const fixedVersion = vulnItem?.patched_versions || vulnItem?.first_patched_version?.identifier;

        const isAffected = affectedRange ? isSemverInRange(version, affectedRange) : false;
        if (isAffected) {
          activeIds.add(primaryId);
          if (ghsaId) activeIds.add(ghsaId);
          if (cveId) activeIds.add(cveId);
        }

        // Check if seen
        const alreadySeen =
          seenIds.has(primaryId) ||
          (ghsaId && seenIds.has(ghsaId)) ||
          (cveId && seenIds.has(cveId));

        if (!alreadySeen) {
          seenIds.add(primaryId);
          if (ghsaId) seenIds.add(ghsaId);
          if (cveId) seenIds.add(cveId);

          const cweList = (ghAdv.cwe_ids || (ghAdv.cwes || []).map((c: any) => c.cwe_id)).filter(Boolean);

          rawAdvisories.push({
            id: primaryId,
            summary: ghAdv.summary || `Security Advisory in ${packageName}: ${primaryId}`,
            details: ghAdv.description,
            aliases,
            published: ghAdv.published_at,
            database_specific: {
              severity: ghAdv.severity,
              cwe_ids: cweList,
            },
            affected: [
              {
                ranges: [
                  {
                    type: 'ECOSYSTEM',
                    events: [
                      ...(affectedRange ? [{ introduced: '0' }] : []),
                      ...(fixedVersion ? [{ fixed: fixedVersion }] : []),
                    ],
                  },
                ],
              },
            ],
            _customAffectedRange: affectedRange,
            _customFixedVersion: fixedVersion,
            _htmlUrl: ghAdv.html_url,
            component: packageName,
            componentType: 'direct',
          });
        }
      }
    }
  } catch (ghErr) {
    console.error('GitHub advisories query error:', ghErr);
  }

  // 2. Parent / Core Ecosystem Packages (e.g., langchain, langchain-core for langchain-postgres)
  const parentPackages = getParentEcosystemPackages(packageName, ecosystem);
  for (const parent of parentPackages) {
    try {
      const pRes = await fetch(OSV_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: { name: parent, ecosystem: osvSys },
        }),
        next: { revalidate: 300 },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        const pVulns = pData.vulns || [];
        auditedComponents.push({ name: parent, type: 'parent-ecosystem', count: pVulns.length });
        for (const v of pVulns) {
          if (!seenIds.has(v.id)) {
            seenIds.add(v.id);
            rawAdvisories.push({ ...v, component: parent, componentType: 'parent-ecosystem' });
          }
        }
      }
    } catch {
      // best effort
    }
  }

  // 3. Direct Supply Chain Dependencies (e.g. asyncpg, numpy, sqlalchemy for langchain-postgres)
  const directDeps = await getDirectDependencies(packageName, version, ecosystem);
  for (const dep of directDeps) {
    if (parentPackages.includes(dep) || dep === packageName) continue;
    try {
      const dRes = await fetch(OSV_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: { name: dep, ecosystem: osvSys },
        }),
        next: { revalidate: 300 },
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        const dVulns = dData.vulns || [];
        if (dVulns.length > 0) {
          auditedComponents.push({ name: dep, type: 'dependency', count: dVulns.length });
          for (const v of dVulns) {
            if (!seenIds.has(v.id)) {
              seenIds.add(v.id);
              rawAdvisories.push({ ...v, component: dep, componentType: 'dependency' });
            }
          }
        }
      }
    } catch {
      // best effort
    }
  }

  // 4. Map & enrich all discovered advisories with NVD and GitHub references
  const mappedAdvisories: SecurityAdvisory[] = rawAdvisories.map((v: any) => {
    const primaryId = v.id || 'UNKNOWN';
    const aliases: string[] = v.aliases || [];
    const cveId = aliases.find((a: string) => a.startsWith('CVE-')) || (primaryId.startsWith('CVE-') ? primaryId : undefined);
    const ghsaId = primaryId.startsWith('GHSA-') ? primaryId : aliases.find((a: string) => a.startsWith('GHSA-'));

    const rawSeverity = v.database_specific?.severity;
    const fixedVersion = v._customFixedVersion || parseFixedVersion(v.affected);
    const affectedRange = v._customAffectedRange || parseAffectedRange(v.affected);
    const cwe = v.database_specific?.cwe_ids?.[0];

    const nvdUrl = cveId ? `https://nvd.nist.gov/vuln/detail/${cveId}` : undefined;
    const githubUrl = v._htmlUrl || (ghsaId ? `https://github.com/advisories/${ghsaId}` : undefined);
    const sourceUrl = githubUrl || nvdUrl || `https://osv.dev/vulnerability/${primaryId}`;

    const isDirectAffecting =
      v.componentType === 'direct' &&
      (activeIds.has(primaryId) ||
        (ghsaId && activeIds.has(ghsaId)) ||
        (cveId && activeIds.has(cveId)) ||
        aliases.some((a: string) => activeIds.has(a)) ||
        (v._customAffectedRange ? isSemverInRange(version, v._customAffectedRange) : false) ||
        isVersionInAffectedRange(version, v.affected));

    return {
      id: primaryId,
      title: v.summary || `Vulnerability in ${v.component}: ${primaryId}`,
      aliases,
      severity: mapOsvSeverity(rawSeverity),
      cwe,
      affectedRange,
      fixedVersion,
      publishedAt: v.published || v.modified || '',
      summary: v.summary || v.details || `Security vulnerability advisory recorded for ${v.component}.`,
      details: v.details,
      sourceUrl,
      nvdUrl,
      githubUrl,
      affectsSelectedVersion: isDirectAffecting,
      component: v.component,
      componentType: v.componentType,
    };
  });

  // Deduplicate and consolidate advisories that share common CVE or GHSA identifiers
  const dedupedMap = new Map<string, SecurityAdvisory>();
  const idToKey = new Map<string, string>();

  for (const adv of mappedAdvisories) {
    const allIdentifiers = [adv.id, ...(adv.aliases || [])].filter(Boolean);
    let canonicalKey: string | undefined;

    for (const id of allIdentifiers) {
      if (idToKey.has(id)) {
        canonicalKey = idToKey.get(id);
        break;
      }
    }

    if (canonicalKey && dedupedMap.has(canonicalKey)) {
      const existing = dedupedMap.get(canonicalKey)!;
      existing.aliases = Array.from(new Set([...(existing.aliases || []), ...(adv.aliases || []), adv.id])).filter(
        (a) => a !== existing.id
      );
      if (!existing.fixedVersion && adv.fixedVersion) existing.fixedVersion = adv.fixedVersion;
      if ((!existing.affectedRange || existing.affectedRange === 'All prior versions') && adv.affectedRange) {
        existing.affectedRange = adv.affectedRange;
      }
      if (!existing.cwe && adv.cwe) existing.cwe = adv.cwe;
      if (!existing.details && adv.details) existing.details = adv.details;
      if (adv.affectsSelectedVersion) existing.affectsSelectedVersion = true;
      if (!existing.nvdUrl && adv.nvdUrl) existing.nvdUrl = adv.nvdUrl;
      if (!existing.githubUrl && adv.githubUrl) existing.githubUrl = adv.githubUrl;
    } else {
      const key = adv.id;
      dedupedMap.set(key, { ...adv });
      for (const id of allIdentifiers) {
        idToKey.set(id, key);
      }
    }
  }

  const finalAdvisories = Array.from(dedupedMap.values());

  // Sort advisories: active direct first, then all direct, then parent, then dependencies, ordered by date desc
  finalAdvisories.sort((a, b) => {
    if (a.affectsSelectedVersion && !b.affectsSelectedVersion) return -1;
    if (!a.affectsSelectedVersion && b.affectsSelectedVersion) return 1;
    const typeOrder = { direct: 0, 'parent-ecosystem': 1, dependency: 2 };
    const orderA = typeOrder[a.componentType || 'direct'] ?? 3;
    const orderB = typeOrder[b.componentType || 'direct'] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const activeAdvisories = finalAdvisories.filter((a) => a.affectsSelectedVersion);
  const parentAdvisories = finalAdvisories.filter((a) => a.componentType === 'parent-ecosystem');
  const dependencyAdvisories = finalAdvisories.filter((a) => a.componentType === 'dependency');

  const status = activeAdvisories.length > 0 ? 'vulnerable' : 'safe';

  const result: SecurityData = {
    status,
    summaryMessage:
      activeAdvisories.length > 0
        ? `Found ${activeAdvisories.length} active security ${
            activeAdvisories.length === 1 ? 'advisory' : 'advisories'
          } affecting release v${version} (${finalAdvisories.length} historical CVE records tracked across ecosystem).`
        : `Release v${version} is clean — 0 active vulnerabilities detected (${finalAdvisories.length} historical CVE records tracked).`,
    checkedVersion: version,
    source: 'OSV.dev v1 / Google deps.dev v3 / NVD NIST 2.0',
    advisories: activeAdvisories,
    allHistoricalAdvisories: finalAdvisories,
    parentEcosystemAdvisories: parentAdvisories,
    dependencyAdvisories,
    totalHistoricalCount: finalAdvisories.length,
    activeCount: activeAdvisories.length,
    sourcesUsed: [
      'https://api.osv.dev/v1/query',
      'https://api.deps.dev/v3',
      'https://services.nvd.nist.gov/rest/json/cves/2.0',
    ],
    auditedComponents,
  };

  setCached(cacheKey, result, 600);
  return result;
}
