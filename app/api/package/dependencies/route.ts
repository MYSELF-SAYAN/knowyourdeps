import { NextRequest, NextResponse } from 'next/server';
import { getDepsDevDependencies } from '@/lib/providers/depsdev';
import { getNpmPackage } from '@/lib/providers/npm';
import { getPyPIPackage } from '@/lib/providers/pypi';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';
  let version = searchParams.get('version') || 'latest';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  if (version === 'latest') {
    const pkg = ecosystem === 'npm' ? await getNpmPackage(name) : await getPyPIPackage(name);
    if (pkg) version = pkg.latestVersion;
  }

  const deps = await getDepsDevDependencies(ecosystem, name, version);
  return NextResponse.json(deps);
}
