import type { ApiEnvelope } from '@/types/auth';

const AUTH_REQUIRED_MESSAGE_PATTERNS = ['로그인이 필요', '인증이 필요', 'unauthorized'];

export class AuthRequiredError extends Error {
  constructor(message = '로그인이 필요합니다.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(message = '접근 권한이 없습니다.') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export function isAuthRequiredMessage(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  const normalizedMessage = message.trim().toLowerCase();

  return AUTH_REQUIRED_MESSAGE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern));
}

export function isAuthRequiredError(error: unknown) {
  return (
    error instanceof AuthRequiredError ||
    (error instanceof Error && isAuthRequiredMessage(error.message))
  );
}

export function isPermissionDeniedError(error: unknown) {
  return error instanceof PermissionDeniedError;
}

export function createApiError<T>(
  response: Response,
  payload: ApiEnvelope<T> | null,
  fallbackMessage: string,
) {
  const errorMessage = typeof payload?.message === 'string' ? payload.message : fallbackMessage;

  if (
    response.status === 401 ||
    payload?.code === 'UNAUTHORIZED' ||
    isAuthRequiredMessage(errorMessage)
  ) {
    return new AuthRequiredError(errorMessage);
  }

  if (response.status === 403 || payload?.code === 'FORBIDDEN') {
    return new PermissionDeniedError(errorMessage);
  }

  return new Error(errorMessage);
}
