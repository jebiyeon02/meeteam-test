import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  JobFieldOption,
  RegisterRequestPayload,
  SejongRegisterRequestPayload,
  SignupSuccessResponse,
} from '@/types/auth';

import {
  checkEmailDuplicate,
  fetchJobOptions,
  registerMember,
  registerSejongMember,
} from '@/components/features/auth/signupApi';

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

describe('fetchJobOptions', () => {
  it('loads job options from backend response', async () => {
    const fields: JobFieldOption[] = [
      {
        code: 'BACKEND',
        name: '백엔드',
        positions: [{ id: 11, code: 'JAVA_SPRING', name: 'Java/Spring' }],
        techStacks: [{ id: 1, name: 'Java' }],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { fields } }),
    } as Response);

    await expect(fetchJobOptions()).resolves.toEqual(fields);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/jobs/options',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('checkEmailDuplicate', () => {
  it('returns duplicate check result', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { exists: false, message: '사용 가능한 이메일입니다.' } }),
    } as Response);

    await expect(checkEmailDuplicate('hello@example.com')).resolves.toEqual({
      exists: false,
      message: '사용 가능한 이메일입니다.',
    });
  });
});

describe('registerMember', () => {
  it('submits multipart form data with request JSON and optional file', async () => {
    const payload: RegisterRequestPayload = {
      email: 'hello@example.com',
      password: 'password123',
      name: '홍길동',
      birthDate: '1998-03-15',
      gender: 'MALE',
      jobPositions: [
        {
          jobFieldCode: 'BACKEND',
          jobPositionCode: 'JAVA_SPRING',
          techStacks: [{ id: 1, displayOrder: 1 }],
        },
      ],
    };

    const response: SignupSuccessResponse = { memberId: 1, username: '홍길동' };
    const imageFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: response }),
    } as Response);

    await expect(registerMember(payload, imageFile)).resolves.toEqual(response);

    const [, requestInit] = vi.mocked(global.fetch).mock.calls[0] ?? [];
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.body).toBeInstanceOf(FormData);

    const formData = requestInit?.body as FormData;
    const requestBlob = formData.get('request');
    expect(requestBlob).toBeInstanceOf(Blob);
    await expect((requestBlob as Blob).text()).resolves.toBe(JSON.stringify(payload));
    expect(formData.get('file')).toBe(imageFile);
  });
});

describe('registerSejongMember', () => {
  it('submits multipart form data with onboarding code to the Sejong register endpoint', async () => {
    const payload: SejongRegisterRequestPayload = {
      code: 'temp-code',
      name: '홍길동',
      birthDate: '1998-03-15',
      gender: 'MALE',
      jobPositions: [
        {
          jobFieldCode: 'BACKEND',
          jobPositionCode: 'JAVA_SPRING',
          techStacks: [{ id: 1, displayOrder: 1 }],
        },
      ],
    };

    const imageFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    await expect(registerSejongMember(payload, imageFile)).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/auth/register/sejong',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );

    const [, requestInit] = vi.mocked(global.fetch).mock.calls[0] ?? [];
    expect(requestInit?.body).toBeInstanceOf(FormData);

    const formData = requestInit?.body as FormData;
    const requestBlob = formData.get('request');
    expect(requestBlob).toBeInstanceOf(Blob);
    await expect((requestBlob as Blob).text()).resolves.toBe(JSON.stringify(payload));
    expect(formData.get('file')).toBe(imageFile);
  });
});
