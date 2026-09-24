import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const BACKEND_URL =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'https://api.meeteam.alom-sejong.com';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, BACKEND_URL);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers();
  for (const name of ['content-type', 'cookie', 'authorization', 'accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    const responseHeaders = new Headers();
    for (const name of ['content-type', 'location']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('cache-control', 'no-store');
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie.replace(/;\s*Domain=[^;]*/i, ''));
    }

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { code: 'UPSTREAM_UNAVAILABLE', message: 'API 서버에 연결할 수 없습니다.', result: null },
      { status: 503 },
    );
  }
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PUT,
  proxyRequest as PATCH,
  proxyRequest as DELETE,
};
