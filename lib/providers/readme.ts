import { getCached, setCached } from '../cache';
import { Ecosystem, ReadmeData } from '../types';

const PYPI_BASE = process.env.PYPI_JSON_BASE_URL || 'https://pypi.org/pypi';
const NPM_REGISTRY = process.env.NPM_REGISTRY_BASE_URL || 'https://registry.npmjs.org';

/**
 * Fetches the package README for a specific version or latest.
 * Supports both npm and PyPI registries with automatic fallback strategies.
 */
export async function getPackageReadme(
  ecosystem: Ecosystem,
  name: string,
  version = 'latest'
): Promise<ReadmeData | null> {
  const normVer = (!version || version === 'latest') ? 'latest' : version;
  const cacheKey = `readme:${ecosystem}:${name.toLowerCase()}:${normVer}`;
  const cached = getCached<ReadmeData>(cacheKey);
  if (cached) return cached;

  if (ecosystem === 'pypi') {
    try {
      const url = normVer !== 'latest'
        ? `${PYPI_BASE}/${encodeURIComponent(name)}/${encodeURIComponent(normVer)}/json`
        : `${PYPI_BASE}/${encodeURIComponent(name)}/json`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'KnowYourDeps-App/1.0' },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        // Fallback to latest if specific version request failed
        if (normVer !== 'latest') {
          const fallbackRes = await fetch(`${PYPI_BASE}/${encodeURIComponent(name)}/json`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const readmeData: ReadmeData = {
              ecosystem: 'pypi',
              name,
              version: data.info?.version || normVer,
              content: data.info?.description || '',
              contentType: data.info?.description_content_type || 'text/markdown',
              source: 'PyPI Registry',
            };
            setCached(cacheKey, readmeData, 3600);
            return readmeData;
          }
        }
        return null;
      }

      const data = await res.json();
      const readmeData: ReadmeData = {
        ecosystem: 'pypi',
        name,
        version: data.info?.version || normVer,
        content: data.info?.description || '',
        contentType: data.info?.description_content_type || 'text/markdown',
        source: 'PyPI Registry',
      };

      setCached(cacheKey, readmeData, 3600);
      return readmeData;
    } catch {
      return null;
    }
  }

  // npm ecosystem
  try {
    // 1. If specific version requested, try CDN fast paths first (jsdelivr preserves exact version README)
    if (normVer !== 'latest') {
      const cdnUrls = [
        `https://cdn.jsdelivr.net/npm/${encodeURIComponent(name)}@${encodeURIComponent(normVer)}/README.md`,
        `https://cdn.jsdelivr.net/npm/${encodeURIComponent(name)}@${encodeURIComponent(normVer)}/Readme.md`,
        `https://cdn.jsdelivr.net/npm/${encodeURIComponent(name)}@${encodeURIComponent(normVer)}/readme.md`,
        `https://unpkg.com/${encodeURIComponent(name)}@${encodeURIComponent(normVer)}/README.md`,
      ];

      for (const cdnUrl of cdnUrls) {
        try {
          const cdnRes = await fetch(cdnUrl, {
            headers: { 'User-Agent': 'KnowYourDeps-App/1.0' },
            next: { revalidate: 86400 }, // CDN immutable cache
          });
          if (cdnRes.ok) {
            const content = await cdnRes.text();
            if (content && content.trim().length > 10) {
              const readmeData: ReadmeData = {
                ecosystem: 'npm',
                name,
                version: normVer,
                content,
                contentType: 'text/markdown',
                source: 'jsDelivr / npm Registry CDN',
              };
              setCached(cacheKey, readmeData, 7200);
              return readmeData;
            }
          }
        } catch {
          // continue fallback
        }
      }
    }

    // 2. Fetch from main npm registry document
    const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': 'KnowYourDeps-App/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    // Check version-specific readme or top-level document readme
    const verReadme = data.versions?.[normVer]?.readme;
    const topReadme = data.readme;
    const content = verReadme || topReadme || '';

    const readmeData: ReadmeData = {
      ecosystem: 'npm',
      name,
      version: normVer === 'latest' ? data['dist-tags']?.latest || normVer : normVer,
      content,
      contentType: 'text/markdown',
      source: 'npm Registry',
    };

    setCached(cacheKey, readmeData, 3600);
    return readmeData;
  } catch {
    return null;
  }
}
