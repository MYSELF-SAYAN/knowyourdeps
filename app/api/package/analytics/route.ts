import { NextRequest, NextResponse } from 'next/server';
import { getNpmAnalytics } from '@/lib/providers/npm';
import { getPyPIAnalytics } from '@/lib/providers/pypi';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';
  const period = searchParams.get('period') || '30d';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  const analytics = ecosystem === 'npm'
    ? await getNpmAnalytics(name, period)
    : await getPyPIAnalytics(name, period);

  return NextResponse.json(analytics);
}
