import { getCached, setCached } from '../cache';
import { PackageOverview, VersionInfo, AnalyticsData, SearchResultItem } from '../types';
import { getGitHubStats } from './github';

const NPM_REGISTRY = process.env.NPM_REGISTRY_BASE_URL || 'https://registry.npmjs.org';
const NPM_DOWNLOADS = process.env.NPM_DOWNLOADS_BASE_URL || 'https://api.npmjs.org';

export async function searchNpm(query: string): Promise<SearchResultItem[]> {
  const cacheKey = `npm:search:${query}`;
  const cached = getCached<SearchResultItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${NPM_REGISTRY}/-/v1/search?text=${encodeURIComponent(query)}&size=12`, {
      headers: { 'User-Agent': 'PackagePulse/1.0.0' },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchResultItem[] = (data.objects || []).map((item: any) => ({
      name: item.package.name,
      ecosystem: 'npm',
      description: item.package.description || '',
      version: item.package.version,
      keywords: item.package.keywords || [],
    }));
    setCached(cacheKey, results, 180);
    return results;
  } catch {
    return [];
  }
}

export async function getNpmPackage(name: string): Promise<PackageOverview | null> {
  const cacheKey = `npm:pkg:${name}`;
  const cached = getCached<PackageOverview>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': 'PackagePulse/1.0.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const latestVer = data['dist-tags']?.latest || Object.keys(data.versions || {}).pop() || '1.0.0';
    const latestObj = data.versions?.[latestVer] || {};
    const timeObj = data.time || {};
    const allVersions = Object.keys(data.versions || {});

    // Get weekly downloads
    let weeklyDownloads = 0;
    try {
      const dlRes = await fetch(`${NPM_DOWNLOADS}/downloads/point/last-week/${encodeURIComponent(name)}`);
      if (dlRes.ok) {
        const dlData = await dlRes.json();
        weeklyDownloads = dlData.downloads || 0;
      }
    } catch {
      // Best effort
    }

    // Extract repository URL
    let repoUrl = '';
    if (typeof latestObj.repository === 'string') {
      repoUrl = latestObj.repository;
    } else if (latestObj.repository?.url) {
      repoUrl = latestObj.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
    } else if (data.repository?.url) {
      repoUrl = data.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
    }

    // Maintainers
    const maintainers = (data.maintainers || []).map((m: any) => m.name || m);

    // Deep stats: size, files, types, runtime
    const unpackedSize = latestObj.dist?.unpackedSize;
    const fileCount = latestObj.dist?.fileCount;
    const hasTypeDefinitions = Boolean(
      latestObj.types || latestObj.typings || data.types || latestObj.dist?.signatures
    );
    const requiresNode = latestObj.engines?.node ? `Node.js ${latestObj.engines.node}` : undefined;
    const dependenciesCount = Object.keys(latestObj.dependencies || {}).length;

    // Fetch GitHub stats if repo URL is available
    let gitHubStats = null;
    if (repoUrl) {
      gitHubStats = await getGitHubStats(repoUrl);
    }

    const overview: PackageOverview = {
      name: data.name,
      ecosystem: 'npm',
      description: data.description || latestObj.description || 'No description provided.',
      latestVersion: latestVer,
      license: latestObj.license || (typeof data.license === 'string' ? data.license : 'Unknown'),
      homepage: latestObj.homepage || data.homepage || '',
      repository: repoUrl,
      author: latestObj.author?.name || (typeof latestObj.author === 'string' ? latestObj.author : ''),
      maintainers,
      keywords: latestObj.keywords || data.keywords || [],
      publishedAt: timeObj.created || '',
      updatedAt: timeObj.modified || timeObj[latestVer] || '',
      isDeprecated: Boolean(latestObj.deprecated),
      deprecationReason: typeof latestObj.deprecated === 'string' ? latestObj.deprecated : undefined,
      installCommand: `npm i ${data.name}`,
      totalDownloadsWeekly: weeklyDownloads,
      dependenciesCount,
      starsCount: gitHubStats?.starsCount,
      forksCount: gitHubStats?.forksCount,
      openIssuesCount: gitHubStats?.openIssuesCount,
      watchersCount: gitHubStats?.watchersCount,
      unpackedSize,
      fileCount,
      hasTypeDefinitions,
      typeDefinitionsType: hasTypeDefinitions ? 'TypeScript (bundled .d.ts)' : undefined,
      totalReleases: allVersions.length,
      requiresRuntime: requiresNode,
      securityStatus: 'safe', // will be enriched
      vulnerabilitiesCount: 0,
    };

    setCached(cacheKey, overview, 300);
    return overview;
  } catch {
    return null;
  }
}

export async function getNpmVersions(name: string): Promise<VersionInfo[]> {
  const cacheKey = `npm:versions:${name}`;
  const cached = getCached<VersionInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': 'PackagePulse/1.0.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const latestVer = data['dist-tags']?.latest;
    const time = data.time || {};
    const versionsObj = data.versions || {};

    const versions: VersionInfo[] = Object.keys(versionsObj)
      .map((ver) => ({
        version: ver,
        publishedAt: time[ver] || '',
        isLatest: ver === latestVer,
        isDeprecated: Boolean(versionsObj[ver]?.deprecated),
        license: versionsObj[ver]?.license || 'Unknown',
      }))
      .reverse(); // latest first

    setCached(cacheKey, versions, 300);
    return versions;
  } catch {
    return [];
  }
}

export async function getNpmAnalytics(name: string, period = '30d'): Promise<AnalyticsData> {
  const cacheKey = `npm:analytics:${name}:${period}`;
  const cached = getCached<AnalyticsData>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;
  else if (period === '365d') days = 365;

  const end = new Date(now.getTime() - 86400000); // yesterday
  const start = new Date(end.getTime() - days * 86400000);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  try {
    const res = await fetch(`${NPM_DOWNLOADS}/downloads/range/${startStr}:${endStr}/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Download stats failed');
    const data = await res.json();

    const history = (data.downloads || []).map((d: any) => ({
      date: d.day,
      downloads: d.downloads,
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

    // Calculate growth: first half vs second half
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
      ecosystem: 'npm',
      packageName: name,
      period,
      totalDownloads,
      dailyAverage,
      growthRatePercent,
      peakDay,
      estimatedMonthly,
      annualizedRunRate,
      history,
      source: 'npm Download Counts API',
      note: 'Downloads represent installation requests from npm clients and CI/CD pipelines.',
    };

    setCached(cacheKey, result, 600);
    return result;
  } catch {
    return {
      ecosystem: 'npm',
      packageName: name,
      period,
      totalDownloads: 0,
      dailyAverage: 0,
      history: [],
      source: 'npm Download Counts API',
      note: 'Download stats currently unavailable.',
    };
  }
}
