import { Ecosystem } from './types';

export interface ParsedDependency {
  name: string;
  version: string;
  rawSpec: string;
  section?: 'dependencies' | 'devDependencies' | 'optionalDependencies' | 'requirements';
}

export interface ParsedManifest {
  ecosystem: Ecosystem;
  fileType: 'package.json' | 'requirements.txt';
  dependencies: ParsedDependency[];
}

function cleanNpmVersion(spec: string): string {
  const trimmed = spec.trim();
  if (
    !trimmed ||
    trimmed === '*' ||
    trimmed === 'latest' ||
    trimmed.startsWith('workspace:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('link:') ||
    trimmed.startsWith('git+') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('npm:')
  ) {
    return 'unpinned';
  }

  // Handle OR ranges like "^1.0.0 || ^2.0.0" -> take first branch
  const firstBranch = trimmed.split('||')[0].trim();
  // Extract first semver-like token (e.g. ">=1.2.3 <2.0.0" -> "1.2.3", "^4.17.20" -> "4.17.20")
  const match = firstBranch.match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  if (match) return match[1];

  const partialMatch = firstBranch.match(/(\d+\.\d+)/);
  if (partialMatch) return `${partialMatch[1]}.0`;

  return 'unpinned';
}

export function parsePackageJson(content: string): ParsedManifest {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON in package.json. Please check the file syntax and try again.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('package.json must contain a JSON object at the root.');
  }

  const sections: Array<'dependencies' | 'devDependencies' | 'optionalDependencies'> = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ];

  const hasAnyDepSection = sections.some(
    (s) => parsed[s] && typeof parsed[s] === 'object' && !Array.isArray(parsed[s])
  );
  if (!hasAnyDepSection) {
    throw new Error(
      'No "dependencies", "devDependencies", or "optionalDependencies" object found in package.json.'
    );
  }

  const seen = new Map<string, ParsedDependency>();

  for (const section of sections) {
    const block = parsed[section];
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue;

    for (const [name, rawVal] of Object.entries(block as Record<string, unknown>)) {
      if (typeof rawVal !== 'string') continue;
      const cleanName = name.trim();
      if (!cleanName || seen.has(cleanName)) continue;

      seen.set(cleanName, {
        name: cleanName,
        version: cleanNpmVersion(rawVal),
        rawSpec: rawVal.trim(),
        section,
      });
    }
  }

  return {
    ecosystem: 'npm',
    fileType: 'package.json',
    dependencies: Array.from(seen.values()),
  };
}

export function parseRequirementsTxt(content: string): ParsedManifest {
  const lines = content.split(/\r?\n/);
  const seen = new Map<string, ParsedDependency>();

  for (const rawLine of lines) {
    // Strip inline comments
    const noComment = rawLine.replace(/\s+#.*$/, '').trim();
    if (!noComment || noComment.startsWith('#')) continue;

    // Skip pip options & nested requirements flags
    if (
      noComment.startsWith('-') ||
      noComment.startsWith('--') ||
      noComment.startsWith('git+') ||
      noComment.startsWith('http://') ||
      noComment.startsWith('https://')
    ) {
      continue;
    }

    // Strip environment markers (e.g. "; python_version < '3.10'")
    const withoutMarkers = noComment.split(';')[0].trim();
    if (!withoutMarkers) continue;

    // Match valid PEP 508 package name (must contain a letter, optional [extras]) and optional PEP 440 version specifiers
    const match = withoutMarkers.match(
      /^([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)(?:\[[A-Za-z0-9._,-]+\])?(?:\s*((?:===|==|~=|>=|<=|!=|>|<)\s*[0-9][0-9A-Za-z.*_-]*(?:\s*,\s*(?:===|==|~=|>=|<=|!=|>|<)\s*[0-9][0-9A-Za-z.*_-]*)*))?$/
    );
    if (!match) continue;

    const name = match[1].trim();
    if (!/[A-Za-z]/.test(name)) continue;
    const spec = (match[2] || '').trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;

    let version = 'unpinned';
    if (spec) {
      // Take the first version constraint, e.g. "==2.25.1" or ">=5.1,<6.0"
      const firstConstraint = spec.split(',')[0].trim();
      const verMatch = firstConstraint.match(/(?:===|==|~=|>=|<=|!=|>|<)?\s*([0-9][0-9A-Za-z._-]*)/);
      if (verMatch) {
        version = verMatch[1];
      }
    }

    seen.set(key, {
      name,
      version,
      rawSpec: spec || 'unpinned',
      section: 'requirements',
    });
  }

  return {
    ecosystem: 'pypi',
    fileType: 'requirements.txt',
    dependencies: Array.from(seen.values()),
  };
}

export function parseManifestFile(fileName: string, content: string): ParsedManifest {
  const lower = fileName.toLowerCase().trim();
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error('The uploaded file is empty.');
  }

  if (lower.endsWith('.json') || lower === 'package.json') {
    return parsePackageJson(content);
  }

  if (lower.endsWith('.txt') || lower.includes('requirements')) {
    return parseRequirementsTxt(content);
  }

  // Fallback: sniff content
  if (trimmedContent.startsWith('{')) {
    return parsePackageJson(content);
  }

  return parseRequirementsTxt(content);
}
