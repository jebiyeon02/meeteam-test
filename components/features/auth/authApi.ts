type ApiEnvelope<T> = {
  code: string;
  message: string;
  result: T;
};

let accessToken: string | null = null;

function clearAccessToken() {
  accessToken = null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    accessToken &&
    !['/api/v1/auth/login/sejong', '/api/v1/auth/register/sejong', '/api/v1/auth/refresh'].includes(
      path,
    )
  ) {
    headers.set('Authorization', accessToken);
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  const receivedToken = response.headers.get('authorization');
  if (receivedToken) {
    accessToken = receivedToken.startsWith('Bearer ') ? receivedToken : `Bearer ${receivedToken}`;
  }
  const data = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ||
        (response.status >= 500
          ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
          : '요청을 처리하지 못했습니다.'),
      response.status,
      data?.code,
    );
  }

  if (!data) {
    throw new ApiError('서버 응답을 확인할 수 없습니다.', response.status);
  }

  return data.result;
}

let refreshPromise: Promise<unknown> | null = null;

export async function refreshSession(): Promise<void> {
  refreshPromise ??= apiRequest<string>('/api/v1/auth/refresh', {
    method: 'POST',
  }).finally(() => {
    refreshPromise = null;
  });
  await refreshPromise;
}

export async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await apiRequest<T>(path, init);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    try {
      await refreshSession();
    } catch (refreshError) {
      if (refreshError instanceof ApiError && [400, 401, 403].includes(refreshError.status)) {
        throw error;
      }
      throw refreshError;
    }
    return apiRequest<T>(path, init);
  }
}

export type SejongLoginResult = { isNewMember: boolean; code: string | null };

export async function loginSejong(studentId: string, password: string): Promise<SejongLoginResult> {
  clearAccessToken();
  const result = await apiRequest<SejongLoginResult & { newMember?: boolean }>(
    '/api/v1/auth/login/sejong',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password }),
    },
  );
  return {
    isNewMember: result.isNewMember ?? result.newMember ?? false,
    code: result.code ?? null,
  };
}

export async function logout() {
  const result = await apiRequest<string>('/api/v1/auth/logout', { method: 'POST' });
  clearAccessToken();
  return result;
}

export type SejongRegistration = {
  code: string;
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  jobPositions: {
    jobFieldCode: string;
    jobPositionCode: string;
    techStacks: { id: number; displayOrder: number }[];
  }[];
  githubUrl: string;
  blogUrl: string;
};

export function registerSejong(request: SejongRegistration, file?: File | null) {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (file) formData.append('file', file);

  return apiRequest<null>('/api/v1/auth/register/sejong', {
    method: 'POST',
    body: formData,
  });
}
