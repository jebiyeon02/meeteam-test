import type {
  EmailDuplicateResponse,
  JobFieldOption,
  RegisterRequestPayload,
  SejongRegisterRequestPayload,
  SignupSuccessResponse,
} from '@/types/auth';

import { API_BASE_URL, apiFetch } from './apiClient';
import { extractApiData } from './signupTransform';

async function readJson<T>(response: Response) {
  const payload = await response.json();

  if (!response.ok) {
    const errorMessage =
      typeof payload?.message === 'string' ? payload.message : '요청 처리 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }

  return payload as T;
}

export async function fetchJobOptions() {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/jobs/options`, {
    method: 'GET',
    cache: 'no-store',
    skipAuthRefresh: true,
  });
  const payload = await readJson<{
    data?: { fields: JobFieldOption[] };
    result?: { fields: JobFieldOption[] };
  }>(response);

  return extractApiData(payload).fields;
}

export async function checkEmailDuplicate(email: string) {
  const encodedEmail = encodeURIComponent(email.trim());
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/email?email=${encodedEmail}`, {
    method: 'POST',
    skipAuthRefresh: true,
  });
  const payload = await readJson<{
    data?: EmailDuplicateResponse;
    result?: EmailDuplicateResponse;
  }>(response);

  return extractApiData(payload);
}

export async function registerMember(payload: RegisterRequestPayload, file?: File | null) {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

  if (file) {
    formData.append('file', file);
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    skipAuthRefresh: true,
    body: formData,
  });
  const data = await readJson<{ data?: SignupSuccessResponse; result?: SignupSuccessResponse }>(
    response,
  );

  return extractApiData(data);
}

export async function registerSejongMember(
  payload: SejongRegisterRequestPayload,
  file?: File | null,
) {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

  if (file) {
    formData.append('file', file);
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/register/sejong`, {
    method: 'POST',
    skipAuthRefresh: true,
    body: formData,
  });
  await readJson<{ data?: null; result?: null }>(response);
}
