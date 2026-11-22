import { NextRequest, NextResponse } from 'next/server';
import { getNpmPackage } from '@/lib/providers/npm';
import { getPyPIPackage } from '@/lib/providers/pypi';
import { getGitHubHealth } from '@/lib/providers/github';
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
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  const health = await getGitHubHealth(pkg.repository || '');

  return NextResponse.json({
    ecosystem,
    packageName: name,
    repositoryUrl: pkg.repository || '',
    health: health || {
      repoUrl: pkg.repository || '',
      stars: 0,
      forks: 0,
      openIssues: 0,
      license: pkg.license,
      signals: [
        { label: 'Repository Status', value: pkg.repository ? 'Linked' : 'Not Provided', status: pkg.repository ? 'good' : 'warning' },
        { label: 'License', value: pkg.license, status: pkg.license !== 'Unknown' ? 'good' : 'warning' },
        { label: 'Deprecated', value: pkg.isDeprecated ? 'Yes' : 'No', status: pkg.isDeprecated ? 'warning' : 'good' },
      ],
    },
  });
}
