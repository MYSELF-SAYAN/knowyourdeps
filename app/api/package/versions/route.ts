import { NextRequest, NextResponse } from 'next/server';
import { getNpmVersions } from '@/lib/providers/npm';
import { getPyPIVersions } from '@/lib/providers/pypi';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  const versions = ecosystem === 'npm'
    ? await getNpmVersions(name)
    : await getPyPIVersions(name);

  return NextResponse.json({
    ecosystem,
    packageName: name,
    totalVersions: versions.length,
    versions,
  });
}
