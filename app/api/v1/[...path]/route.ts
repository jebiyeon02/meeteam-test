import { NextRequest, NextResponse } from 'next/server';

const API_ORIGIN =
  process.env.MEETEAM_API_BASE_URL ?? 'https://remedy-wrapping-mileage-circuits.trycloudflare.com';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '허용되지 않은 요청입니다.' },
      { status: 403 },
    );
  }

  const { path } = await context.params;
  if (path.some((segment) => !segment || segment === '..' || segment.includes('/'))) {
    return NextResponse.json(
      { code: 'BAD_PATH', message: '잘못된 API 경로입니다.' },
      { status: 400 },
    );
  }

  const url = new URL(`/api/v1/${path.join('/')}${request.nextUrl.search}`, API_ORIGIN);
  const headers = new Headers();
  for (const name of ['accept', 'authorization', 'content-type', 'cookie']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'authorization', 'location']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie.replace(/;\s*Domain=[^;]*/i, ''));
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json(
      {
        code: 'API_UNAVAILABLE',
        message: 'API 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
