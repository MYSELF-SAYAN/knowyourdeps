import { getCached, setCached } from '../cache';

export interface GitHubStats {
  starsCount?: number;
  forksCount?: number;
  openIssuesCount?: number;
  watchersCount?: number;
  repoOwner?: string;
  repoName?: string;
  githubUrl?: string;
}

export interface GitHubHealthData {
  repoUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers?: number;
  signals: { label: string; value: string; status: 'good' | 'warning' | 'critical' }[];
}

/**
 * Extracts owner and repo from various GitHub URL formats:
 * - https://github.com/owner/repo
 * - git+https://github.com/owner/repo.git
 * - git://github.com/owner/repo
 * - github.com/owner/repo
 */
export function parseGitHubUrl(url?: string): { owner: string; repo: string } | null {
  if (!url) return null;
  const cleaned = url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '');

  const match = cleaned.match(/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)/i);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
  };
}

/**
 * Fetches GitHub repository stats with caching.
 * Falls back gracefully on error or rate-limiting (403).
 */
export async function getGitHubStats(repoUrl?: string): Promise<GitHubStats | null> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const cacheKey = `github:stats:${owner.toLowerCase()}:${repo.toLowerCase()}`;
  const cached = getCached<GitHubStats>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'User-Agent': 'KnowYourDeps-App/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const basic: GitHubStats = {
        repoOwner: owner,
        repoName: repo,
        githubUrl: `https://github.com/${owner}/${repo}`,
      };
      setCached(cacheKey, basic, 600);
      return basic;
    }

    const data = await res.json();
    const stats: GitHubStats = {
      starsCount: typeof data.stargazers_count === 'number' ? data.stargazers_count : undefined,
      forksCount: typeof data.forks_count === 'number' ? data.forks_count : undefined,
      openIssuesCount: typeof data.open_issues_count === 'number' ? data.open_issues_count : undefined,
      watchersCount: typeof data.subscribers_count === 'number' ? data.subscribers_count : undefined,
      repoOwner: owner,
      repoName: repo,
      githubUrl: `https://github.com/${owner}/${repo}`,
    };

    setCached(cacheKey, stats, 7200);
    return stats;
  } catch {
    return {
      repoOwner: owner,
      repoName: repo,
      githubUrl: `https://github.com/${owner}/${repo}`,
    };
  }
}

/**
 * Health check helper consumed by /api/package/health
 */
export async function getGitHubHealth(repoUrl?: string): Promise<GitHubHealthData | null> {
  const stats = await getGitHubStats(repoUrl);
  if (!stats) return null;

  const stars = stats.starsCount || 0;
  const forks = stats.forksCount || 0;
  const openIssues = stats.openIssuesCount || 0;

  return {
    repoUrl: stats.githubUrl || repoUrl || '',
    stars,
    forks,
    openIssues,
    watchers: stats.watchersCount,
    signals: [
      {
        label: 'Repository Status',
        value: 'Active GitHub Repository',
        status: 'good',
      },
      {
        label: 'Community Interest',
        value: `${stars.toLocaleString()} Stargazers`,
        status: stars > 100 ? 'good' : 'warning',
      },
      {
        label: 'Network Forks',
        value: `${forks.toLocaleString()} Forks`,
        status: 'good',
      },
      {
        label: 'Issue Backlog',
        value: `${openIssues.toLocaleString()} Open Issues`,
        status: openIssues > 800 ? 'warning' : 'good',
      },
    ],
  };
}
