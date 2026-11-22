import { getCached, setCached } from '../cache';
import { PackageOverview, VersionInfo, AnalyticsData, SearchResultItem } from '../types';
import { getGitHubStats } from './github';

const PYPI_BASE = process.env.PYPI_JSON_BASE_URL || 'https://pypi.org/pypi';
const PYPI_STATS = process.env.PYPI_STATS_BASE_URL || 'https://pypistats.org/api';

export async function searchPyPI(query: string): Promise<SearchResultItem[]> {
  const cacheKey = `pypi:search:${query}`;
  const cached = getCached<SearchResultItem[]>(cacheKey);
  if (cached) return cached;

  try {
    // Try PyPI JSON direct match first, or fall back to deps.dev search
    const directRes = await fetch(`${PYPI_BASE}/${encodeURIComponent(query)}/json`);
    const results: SearchResultItem[] = [];

    if (directRes.ok) {
      const data = await directRes.json();
      results.push({
        name: data.info.name,
        ecosystem: 'pypi',
        description: data.info.summary || '',
        version: data.info.version,
        keywords: data.info.keywords ? data.info.keywords.split(',').map((k: string) => k.trim()) : [],
      });
    }

    // Also query deps.dev for related PyPI packages
    try {
      const depsRes = await fetch(`https://api.deps.dev/v3/systems/PYPI/packages/${encodeURIComponent(query)}`);
      if (depsRes.ok) {
        const d = await depsRes.json();
        if (d.packageKey && !results.some((r) => r.name.toLowerCase() === d.packageKey.name.toLowerCase())) {
          results.push({
            name: d.packageKey.name,
            ecosystem: 'pypi',
            description: '',
            version: d.versions?.[d.versions.length - 1]?.versionKey?.version || '1.0.0',
          });
        }
      }
    } catch {
      // ignore
    }

    setCached(cacheKey, results, 180);
    return results;
  } catch {
    return [];
  }
}

export async function getPyPIPackage(name: string): Promise<PackageOverview | null> {
  const cacheKey = `pypi:pkg:${name}`;
  const cached = getCached<PackageOverview>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${PYPI_BASE}/${encodeURIComponent(name)}/json`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const info = data.info || {};
    const releases = data.releases || {};
    const allVersions = Object.keys(releases);

    let weeklyDownloads = 0;
    try {
      const statsRes = await fetch(`${PYPI_STATS}/packages/${encodeURIComponent(name)}/overall`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const rows = (statsData.data || [])
          .filter((r: any) => r.category === 'without_mirrors')
          .slice(-7);
        weeklyDownloads = rows.reduce((acc: number, r: any) => acc + (r.downloads || 0), 0);
      }
    } catch {
      // Best effort
    }

    const keywords = info.keywords
      ? typeof info.keywords === 'string'
        ? info.keywords.split(',').map((s: string) => s.trim())
        : info.keywords
      : [];

    // Repository URL detection
    let repoUrl =
      info.project_urls?.Source ||
      info.project_urls?.Repository ||
      info.project_urls?.['Source Code'] ||
      info.project_urls?.GitHub ||
      info.home_page ||
      '';

    if (!repoUrl.includes('github.com') && info.project_urls) {
      for (const val of Object.values(info.project_urls)) {
        if (typeof val === 'string' && val.includes('github.com')) {
          repoUrl = val;
          break;
        }
      }
    }

    // Deep stats: size, files, typing, python version, total releases
    const latestFiles = releases[info.version] || [];
    const unpackedSize = latestFiles[0]?.size;
    const hasTypeDefinitions =
      info.classifiers?.some((c: string) => c.includes('Typed')) ||
      keywords.some((k: string) => k.toLowerCase().includes('typing') || k.toLowerCase().includes('types'));
    const dependenciesCount = info.requires_dist?.length || 0;
    const requiresPython = info.requires_python ? `Python ${info.requires_python}` : undefined;

    // Fetch GitHub stars, forks, issues if repo is on GitHub
    let gitHubStats = null;
    if (repoUrl) {
      gitHubStats = await getGitHubStats(repoUrl);
    }

    const overview: PackageOverview = {
      name: info.name,
      ecosystem: 'pypi',
      description: info.summary || 'No summary available.',
      latestVersion: info.version,
      license: info.license || 'Unknown',
      homepage: info.home_page || info.project_url || '',
      repository: repoUrl,
      author: info.author || info.maintainer || '',
      maintainers: info.maintainer ? [info.maintainer] : info.author ? [info.author] : [],
      keywords,
      publishedAt: releases[info.version]?.[0]?.upload_time || '',
      updatedAt: releases[info.version]?.[0]?.upload_time || '',
      installCommand: `pip install ${info.name}`,
      totalDownloadsWeekly: weeklyDownloads,
      dependenciesCount,
      starsCount: gitHubStats?.starsCount,
      forksCount: gitHubStats?.forksCount,
      openIssuesCount: gitHubStats?.openIssuesCount,
      watchersCount: gitHubStats?.watchersCount,
      unpackedSize,
      fileCount: latestFiles.length,
      hasTypeDefinitions,
      typeDefinitionsType: hasTypeDefinitions ? 'PEP 561 (py.typed / Typed)' : undefined,
      totalReleases: allVersions.length,
      requiresRuntime: requiresPython,
      securityStatus: 'safe',
      vulnerabilitiesCount: 0,
    };

    setCached(cacheKey, overview, 300);
    return overview;
  } catch {
    return null;
  }
}

export async function getPyPIVersions(name: string): Promise<VersionInfo[]> {
  const cacheKey = `pypi:versions:${name}`;
  const cached = getCached<VersionInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${PYPI_BASE}/${encodeURIComponent(name)}/json`);
    if (!res.ok) return [];
    const data = await res.json();
    const latest = data.info?.version;
    const releases = data.releases || {};

    const versions: VersionInfo[] = Object.keys(releases)
      .map((ver) => ({
        version: ver,
        publishedAt: releases[ver]?.[0]?.upload_time || '',
        isLatest: ver === latest,
        license: data.info?.license || 'Unknown',
      }))
      .reverse();

    setCached(cacheKey, versions, 300);
    return versions;
  } catch {
    return [];
  }
}

export async function getPyPIAnalytics(name: string, period = '30d'): Promise<AnalyticsData> {
  const cacheKey = `pypi:analytics:${name}:${period}`;
  const cached = getCached<AnalyticsData>(cacheKey);
  if (cached) return cached;

  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;
  else if (period === '365d') days = 180; // pypistats provides up to 180 days

  try {
    const res = await fetch(`${PYPI_STATS}/packages/${encodeURIComponent(name)}/overall`);
    if (!res.ok) throw new Error('PyPI stats failed');
    const data = await res.json();

    // Data format: array of { category: "with_mirrors" | "without_mirrors", date: "YYYY-MM-DD", downloads: N }
    const filtered = (data.data || [])
      .filter((r: any) => r.category === 'without_mirrors')
      .slice(-days);

    const history = filtered.map((r: any) => ({
      date: r.date,
      downloads: r.downloads,
    }));

    const totalDownloads = history.reduce((acc: number, cur: any) => acc + cur.downloads, 0);
    const dailyAverage = history.length ? Math.round(totalDownloads / history.length) : 0;

    // Peak single day
    let peakDay: { date: string; downloads: number } | undefined = undefined;
    if (history.length > 0) {
      const peak = history.reduce((max: any, cur: any) => (cur.downloads > max.downloads ? cur : max), history[0]);
      if (peak && peak.downloads > 0) {
        peakDay = { date: peak.date, downloads: peak.downloads };
      }
    }

    let growthRatePercent = 0;
    if (history.length >= 4) {
      const half = Math.floor(history.length / 2);
      const firstHalf = history.slice(0, half).reduce((a: number, b: any) => a + b.downloads, 0);
      const secondHalf = history.slice(half).reduce((a: number, b: any) => a + b.downloads, 0);
      if (firstHalf > 0) {
        growthRatePercent = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
      }
    }

    const estimatedMonthly = dailyAverage * 30;
    const annualizedRunRate = dailyAverage * 365;

    const result: AnalyticsData = {
      ecosystem: 'pypi',
      packageName: name,
      period,
      totalDownloads,
      dailyAverage,
      growthRatePercent,
      peakDay,
      estimatedMonthly,
      annualizedRunRate,
      history,
      source: 'pypistats API (without mirrors)',
      note: 'Downloads represent installation events from PyPI without mirror traffic.',
    };

    setCached(cacheKey, result, 600);
    return result;
  } catch {
    return {
      ecosystem: 'pypi',
      packageName: name,
      period,
      totalDownloads: 0,
      dailyAverage: 0,
      history: [],
      source: 'pypistats API',
      note: 'Download stats currently unavailable.',
    };
  }
}
