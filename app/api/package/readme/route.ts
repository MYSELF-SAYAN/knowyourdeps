import { NextRequest, NextResponse } from 'next/server';
import { getPackageReadme } from '@/lib/providers/readme';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';
  const version = searchParams.get('version') || 'latest';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  const readme = await getPackageReadme(ecosystem, name, version);

  if (!readme) {
    return NextResponse.json(
      {
        ecosystem,
        name,
        version,
        content: '',
        contentType: 'text/markdown',
        source: 'None',
        error: `README not available for ${name}@${version}`,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(readme);
}
