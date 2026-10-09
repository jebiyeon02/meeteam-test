export const API_BASE_URL = '';
export const AUTH_SESSION_EXPIRED_EVENT = 'meeteam:auth-session-expired';

type ApiFetchInit = RequestInit & {
  skipAuthRefresh?: boolean;
};

let refreshRequest: Promise<boolean> | null = null;
let accessToken: string | null = null;

async function fetchWithSession(input: RequestInfo | URL, init?: RequestInit) {
  const url = getRequestUrl(input);
  const isLogin = url.includes('/api/v1/auth/login/');
  if (isLogin) accessToken = null;
  const headers = new Headers(init?.headers);
  if (accessToken && !isLogin && !url.includes('/api/v1/auth/refresh')) {
    headers.set('Authorization', accessToken);
  }
  const response = await fetch(input, {
    ...init,
    ...(headers.has('Authorization') ? { headers } : {}),
  });
  if (response.ok) {
    const token = response.headers?.get('authorization');
    if (token) accessToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    if (url.includes('/api/v1/auth/logout')) accessToken = null;
  }
  return response;
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function shouldSkipAuthRefresh(input: RequestInfo | URL, init?: ApiFetchInit) {
  if (init?.skipAuthRefresh) {
    return true;
  }

  const url = getRequestUrl(input);

  return url.includes('/api/v1/auth/refresh');
}

async function refreshAuthSession() {
  if (!refreshRequest) {
    refreshRequest = fetchWithSession(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

function notifyAuthSessionExpired() {
  accessToken = null;
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

function withCredentials(init?: ApiFetchInit): RequestInit {
  const requestInit = { ...init };
  delete requestInit.skipAuthRefresh;

  return {
    ...requestInit,
    credentials: 'include',
  };
}

export async function apiFetch(input: RequestInfo | URL, init?: ApiFetchInit) {
  const requestInit = withCredentials(init);
  const response = await fetchWithSession(input, requestInit);

  if (response.status !== 401 || shouldSkipAuthRefresh(input, init)) {
    return response;
  }

  const refreshed = await refreshAuthSession();

  if (!refreshed) {
    notifyAuthSessionExpired();
    return response;
  }

  const retryResponse = await fetchWithSession(input, requestInit);

  if (retryResponse.status === 401) {
    notifyAuthSessionExpired();
  }

  return retryResponse;
}
