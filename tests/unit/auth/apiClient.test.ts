import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  API_BASE_URL,
  AUTH_SESSION_EXPIRED_EVENT,
  apiFetch,
} from '@/components/features/auth/apiClient';

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  global.fetch = originalFetch;
});

describe('apiFetch', () => {
  it('forwards a login access token and replaces it after refresh', async () => {
    const client = await import('@/components/features/auth/apiClient');
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('{}', { headers: { authorization: 'Bearer test-access-token' } }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(
        new Response('{}', { headers: { authorization: 'Bearer refreshed-test-token' } }),
      )
      .mockResolvedValueOnce(new Response('{}'))
      .mockResolvedValueOnce(new Response('{}'));
    await client.apiFetch('/api/v1/auth/login/sejong', { method: 'POST', skipAuthRefresh: true });
    await client.apiFetch('/api/v1/members/me');
    const calls = vi.mocked(global.fetch).mock.calls;
    expect(new Headers(calls[1]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer test-access-token',
    );
    expect(new Headers(calls[3]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer refreshed-test-token',
    );
    await client.apiFetch('/api/v1/auth/logout', { method: 'POST', skipAuthRefresh: true });
  });
  it('includes cookies by default', async () => {
    const response = { ok: true, status: 200 } as Response;
    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(apiFetch(`${API_BASE_URL}/api/v1/members/me`)).resolves.toBe(response);

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/v1/members/me`,
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('refreshes auth cookies and retries the original request once after a 401', async () => {
    const expiredResponse = { ok: false, status: 401 } as Response;
    const refreshResponse = { ok: true, status: 200 } as Response;
    const retryResponse = { ok: true, status: 200 } as Response;

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(expiredResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(retryResponse);

    await expect(apiFetch(`${API_BASE_URL}/api/v1/members/me`, { method: 'GET' })).resolves.toBe(
      retryResponse,
    );

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/api/v1/members/me`,
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/v1/auth/refresh`,
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}/api/v1/members/me`,
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('returns the original 401 when refresh fails', async () => {
    const expiredResponse = { ok: false, status: 401 } as Response;
    const refreshResponse = { ok: false, status: 401 } as Response;
    const dispatchEvent = vi.fn();

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(expiredResponse)
      .mockResolvedValueOnce(refreshResponse);
    vi.stubGlobal('window', { dispatchEvent });

    await expect(apiFetch(`${API_BASE_URL}/api/v1/members/me`)).resolves.toBe(expiredResponse);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect(dispatchEvent.mock.calls[0]?.[0].type).toBe(AUTH_SESSION_EXPIRED_EVENT);
  });

  it('notifies session expiration when the retried request still returns 401', async () => {
    const expiredResponse = { ok: false, status: 401 } as Response;
    const refreshResponse = { ok: true, status: 200 } as Response;
    const retryResponse = { ok: false, status: 401 } as Response;
    const dispatchEvent = vi.fn();

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(expiredResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(retryResponse);
    vi.stubGlobal('window', { dispatchEvent });

    await expect(apiFetch(`${API_BASE_URL}/api/v1/members/me`)).resolves.toBe(retryResponse);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect(dispatchEvent.mock.calls[0]?.[0].type).toBe(AUTH_SESSION_EXPIRED_EVENT);
  });

  it('does not refresh when skipAuthRefresh is set', async () => {
    const unauthorizedResponse = { ok: false, status: 401 } as Response;
    global.fetch = vi.fn().mockResolvedValue(unauthorizedResponse);

    await expect(
      apiFetch(`${API_BASE_URL}/api/v1/auth/login/sejong`, {
        method: 'POST',
        skipAuthRefresh: true,
      }),
    ).resolves.toBe(unauthorizedResponse);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/v1/auth/login/sejong`,
      expect.not.objectContaining({ skipAuthRefresh: true }),
    );
  });
});
