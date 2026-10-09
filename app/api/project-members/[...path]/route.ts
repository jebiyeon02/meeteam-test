import { NextRequest } from 'next/server';
import { proxyApi } from '@/app/api/upstreamProxy';

export function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyApi(request, context, '/api/project-members');
}
