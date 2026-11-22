import { Ecosystem, AlternativePackage } from '../types';
import { searchNpm } from './npm';
import { searchPyPI } from './pypi';

// Curated top functional alternatives database
const KNOWN_ALTERNATIVES: Record<string, { alt: string; reason: string }[]> = {
  // npm
  axios: [
    { alt: 'got', reason: 'Human-friendly and powerful HTTP request library for Node.js' },
    { alt: 'ky', reason: 'Tiny and elegant HTTP client based on the browser Fetch API' },
    { alt: 'undici', reason: 'An HTTP/1.1 client, written from scratch for Node.js, official Node engine' },
    { alt: 'superagent', reason: 'Small progressive client-side HTTP request library and Node.js module' },
  ],
  express: [
    { alt: 'fastify', reason: 'Fast and low overhead web framework, for Node.js' },
    { alt: 'hono', reason: 'Ultrafast, lightweight, multi-runtime web framework' },
    { alt: 'koa', reason: 'Expressive HTTP middleware framework by the creators of Express' },
  ],
  lodash: [
    { alt: 'radash', reason: 'Modern utility library with zero dependencies and TypeScript native support' },
    { alt: 'ramda', reason: 'Practical functional programming library for JavaScript' },
    { alt: 'es-toolkit', reason: 'Modern JavaScript utility library with high performance and small bundle size' },
  ],
  react: [
    { alt: 'vue', reason: 'Progressive JavaScript framework for building user interfaces' },
    { alt: 'svelte', reason: 'Cybernetically enhanced web apps with compile-time reactivity' },
    { alt: 'preact', reason: 'Fast 3kB alternative to React with the same modern API' },
  ],
  chalk: [
    { alt: 'picocolors', reason: 'The tiniest and fastest library for formatting terminal output with ANSI colors' },
    { alt: 'kleur', reason: 'The fastest Node.js library for formatting terminal text with ANSI colors' },
  ],
  moment: [
    { alt: 'date-fns', reason: 'Modern JavaScript date utility library with modular imports' },
    { alt: 'dayjs', reason: '2kB immutable date-time library alternative to Moment.js' },
    { alt: 'luxon', reason: 'A powerful, modern, and friendly wrapper for Luxon date and time' },
  ],
  // PyPI
  requests: [
    { alt: 'httpx', reason: 'Next generation HTTP client for Python with sync & async support' },
    { alt: 'aiohttp', reason: 'Asynchronous HTTP Client/Server for asyncio' },
    { alt: 'urllib3', reason: 'Python HTTP library with thread-safe connection pooling' },
  ],
  flask: [
    { alt: 'fastapi', reason: 'High performance, easy to learn, fast to code, ready for production' },
    { alt: 'django', reason: 'The high-level Python Web framework that encourages rapid development' },
    { alt: 'litestar', reason: 'Production-ready, highly performant, extensible ASGI API framework' },
  ],
  pytest: [
    { alt: 'nose2', reason: 'The next generation of nicer testing for Python' },
    { alt: 'hypothesis', reason: 'Advanced property-based testing library' },
  ],
  pandas: [
    { alt: 'polars', reason: 'Blazingly fast DataFrames library implemented in Rust with Apache Arrow' },
    { alt: 'dask', reason: 'Parallel computing with task scheduling and distributed DataFrames' },
  ],
};

// Levenshtein distance for typosquatting / name similarity detection
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[bn][an];
}

export async function getAlternatives(ecosystem: Ecosystem, packageName: string, keywords: string[] = []): Promise<AlternativePackage[]> {
  const normName = packageName.toLowerCase();
  const results: AlternativePackage[] = [];

  // 1. Check curated list
  const known = KNOWN_ALTERNATIVES[normName];
  if (known) {
    for (const item of known) {
      results.push({
        name: item.alt,
        ecosystem,
        description: item.reason,
        weeklyDownloads: 0,
        latestVersion: 'latest',
        reason: item.reason,
        matchType: 'functional',
      });
    }
  }

  // 2. Dynamic discovery via keywords or ecosystem search
  if (results.length < 4 && keywords.length > 0) {
    const searchTarget = keywords[0];
    const searchRes = ecosystem === 'npm' ? await searchNpm(searchTarget) : await searchPyPI(searchTarget);
    for (const item of searchRes) {
      if (item.name.toLowerCase() !== normName && !results.some(r => r.name.toLowerCase() === item.name.toLowerCase())) {
        const dist = levenshtein(normName, item.name.toLowerCase());
        const isNameSimilar = dist <= 2 && dist > 0;

        results.push({
          name: item.name,
          ecosystem,
          description: item.description,
          weeklyDownloads: 0,
          latestVersion: item.version,
          reason: isNameSimilar
            ? `Name similarity warning: distance ${dist} characters (potential typosquat signal)`
            : `Shares keyword '${searchTarget}' with ${packageName}`,
          matchType: isNameSimilar ? 'name-similar' : 'functional',
        });
      }
      if (results.length >= 6) break;
    }
  }

  return results;
}
