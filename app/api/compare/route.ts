import { NextRequest, NextResponse } from 'next/server';
import { getNpmPackage, getNpmAnalytics, getNpmVersions } from '@/lib/providers/npm';
import { getPyPIPackage, getPyPIAnalytics, getPyPIVersions } from '@/lib/providers/pypi';
import { getDepsDevSecurity, getDepsDevDependencies } from '@/lib/providers/depsdev';
import { Ecosystem, ComparisonTarget, ComparisonResultItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packages } = body; // Array of { ecosystem: Ecosystem, name: string, version?: string }

    if (!Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({ error: 'Packages array required' }, { status: 400 });
    }

    const targets: ComparisonTarget[] = packages.slice(0, 4).map((t: any) => {
      let eco = (t.ecosystem || 'npm').toLowerCase() as Ecosystem;
      let rawName = (t.name || '').trim();
      let version = t.version?.trim();

      // Support inline name@version syntax (e.g. "react@18.2.0" or "@scope/pkg@1.0.0")
      if (!version && rawName.includes('@')) {
        const lastAt = rawName.lastIndexOf('@');
        if (lastAt > 0) {
          version = rawName.slice(lastAt + 1);
          rawName = rawName.slice(0, lastAt);
        }
      }

      return {
        ecosystem: eco,
        name: rawName,
        version: version || undefined,
      };
    });

    const comparisonResults = await Promise.all(
      targets.map(async (t: ComparisonTarget): Promise<ComparisonResultItem | null> => {
        const eco = t.ecosystem;
        const pkg = eco === 'npm' ? await getNpmPackage(t.name) : await getPyPIPackage(t.name);
        if (!pkg) return null;

        const targetVersion = (t.version && t.version !== 'latest') ? t.version : pkg.latestVersion;

        const [analytics, security, deps, versions] = await Promise.all([
          eco === 'npm' ? getNpmAnalytics(t.name, '30d') : getPyPIAnalytics(t.name, '30d'),
          getDepsDevSecurity(eco, pkg.name, targetVersion),
          getDepsDevDependencies(eco, pkg.name, targetVersion),
          eco === 'npm' ? getNpmVersions(t.name) : getPyPIVersions(t.name),
        ]);

        // If targetVersion differs from latestVersion, update publishedAt if found in versions list
        const matchedVersion = versions.find((v) => v.version === targetVersion);
        const resolvedOverview = matchedVersion
          ? {
              ...pkg,
              publishedAt: matchedVersion.publishedAt || pkg.publishedAt,
              license: matchedVersion.license || pkg.license,
            }
          : pkg;

        return {
          overview: resolvedOverview,
          analytics,
          security,
          deps,
          selectedVersion: targetVersion,
          versions: versions.slice(0, 50), // Provide top 50 versions for real-time selector
        };
      })
    );

    return NextResponse.json({
      results: comparisonResults.filter(Boolean),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Comparison failed' }, { status: 500 });
  }
}
