import { NextRequest, NextResponse } from 'next/server';
import { getPackageSecurity, lookupDirectCve } from '@/lib/providers/security';
import { getNpmPackage } from '@/lib/providers/npm';
import { getPyPIPackage } from '@/lib/providers/pypi';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cveQuery = searchParams.get('cve');

  // Direct CVE lookup
  if (cveQuery && cveQuery.trim()) {
    const directAdvisory = await lookupDirectCve(cveQuery.trim());
    if (directAdvisory) {
      return NextResponse.json({
        status: 'vulnerable',
        summaryMessage: `Direct lookup result for ${cveQuery}`,
        checkedVersion: 'all',
        source: 'OSV.dev v1 / NVD NIST 2.0',
        advisories: [directAdvisory],
        allHistoricalAdvisories: [directAdvisory],
        totalHistoricalCount: 1,
        activeCount: 1,
      });
    }
  }

  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';
  let version = searchParams.get('version') || 'latest';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  // Resolve 'latest' to actual semver
  if (version === 'latest') {
    const pkg = ecosystem === 'npm' ? await getNpmPackage(name) : await getPyPIPackage(name);
    if (pkg) version = pkg.latestVersion;
  }

  const security = await getPackageSecurity(ecosystem, name, version);
  return NextResponse.json(security);
}
