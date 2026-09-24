type ApiEnvelope<T> = {
  code: string;
  message: string;
  result: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(data?.message || '요청을 처리하지 못했습니다.', response.status);
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

export function loginSejong(studentId: string, password: string) {
  return apiRequest<SejongLoginResult>('/api/v1/auth/login/sejong', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password }),
  });
}

export function logout() {
  return apiRequest<string>('/api/v1/auth/logout', { method: 'POST' });
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
