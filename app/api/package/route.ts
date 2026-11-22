import { NextRequest, NextResponse } from 'next/server';
import { getNpmPackage } from '@/lib/providers/npm';
import { getPyPIPackage } from '@/lib/providers/pypi';
import { getDepsDevSecurity } from '@/lib/providers/depsdev';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  const pkg = ecosystem === 'npm' ? await getNpmPackage(name) : await getPyPIPackage(name);

  if (!pkg) {
    return NextResponse.json({ error: `Package '${name}' not found in ${ecosystem}` }, { status: 404 });
  }

  // Quick enrichment with security status
  try {
    const sec = await getDepsDevSecurity(ecosystem, pkg.name, pkg.latestVersion);
    pkg.securityStatus = sec.status;
    pkg.vulnerabilitiesCount = sec.advisories.length;
  } catch {
    // best effort
  }

  return NextResponse.json(pkg);
}
