import { NextRequest, NextResponse } from 'next/server';
import { getNpmPackage, getNpmAnalytics } from '@/lib/providers/npm';
import { getPyPIPackage, getPyPIAnalytics } from '@/lib/providers/pypi';
import { getDepsDevSecurity, getDepsDevDependencies } from '@/lib/providers/depsdev';
import { Ecosystem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packages } = body; // Array of { ecosystem: Ecosystem, name: string }

    if (!Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({ error: 'Packages array required' }, { status: 400 });
    }

    const targets = packages.slice(0, 4);
    const comparisonResults = await Promise.all(
      targets.map(async (t: { ecosystem: Ecosystem; name: string }) => {
        const eco = t.ecosystem || 'npm';
        const pkg = eco === 'npm' ? await getNpmPackage(t.name) : await getPyPIPackage(t.name);
        if (!pkg) return null;

        const [analytics, security, deps] = await Promise.all([
          eco === 'npm' ? getNpmAnalytics(t.name, '30d') : getPyPIAnalytics(t.name, '30d'),
          getDepsDevSecurity(eco, pkg.name, pkg.latestVersion),
          getDepsDevDependencies(eco, pkg.name, pkg.latestVersion),
        ]);

        return {
          overview: pkg,
          analytics,
          security,
          deps,
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
