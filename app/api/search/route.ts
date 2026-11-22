import { NextRequest, NextResponse } from 'next/server';
import { searchNpm } from '@/lib/providers/npm';
import { searchPyPI } from '@/lib/providers/pypi';
import { Ecosystem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ecosystem = (searchParams.get('ecosystem') || 'npm').toLowerCase() as Ecosystem;
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = ecosystem === 'npm' ? await searchNpm(q) : await searchPyPI(q);
  return NextResponse.json({ results, ecosystem, query: q });
}
