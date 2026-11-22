import { NextRequest, NextResponse } from 'next/server';
import { getAlternatives } from '@/lib/providers/alternatives';
import { getNpmPackage } from '@/lib/providers/npm';
import { getPyPIPackage } from '@/lib/providers/pypi';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const name = searchParams.get('name') || '';

  if (!name.trim()) {
    return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
  }

  // Get keywords to improve dynamic alternatives
  const pkg = ecosystem === 'npm' ? await getNpmPackage(name) : await getPyPIPackage(name);
  const keywords = pkg?.keywords || [];

  const alternatives = await getAlternatives(ecosystem, name, keywords);
  return NextResponse.json({
    ecosystem,
    packageName: name,
    alternatives,
  });
}
