import { describe, expect, it } from 'vitest';

import {
  AuthRequiredError,
  PermissionDeniedError,
  createApiError,
  isAuthRequiredError,
  isPermissionDeniedError,
} from '@/components/features/auth/authError';

describe('createApiError', () => {
  it('401 응답은 로그인 필요 에러로 분류한다', () => {
    const error = createApiError(
      { status: 401 } as Response,
      { message: '인증이 필요합니다.' },
      '요청에 실패했습니다.',
    );

    expect(error).toBeInstanceOf(AuthRequiredError);
    expect(isAuthRequiredError(error)).toBe(true);
    expect(isPermissionDeniedError(error)).toBe(false);
  });

  it('403 응답은 권한 없음 에러로 분류하고 로그인 모달 대상으로 보지 않는다', () => {
    const error = createApiError(
      { status: 403 } as Response,
      {
        code: 'PROJECT_MEMBER403',
        message: '해당 프로젝트 관리 권한이 없습니다.',
      },
      '요청에 실패했습니다.',
    );

    expect(error).toBeInstanceOf(PermissionDeniedError);
    expect(isPermissionDeniedError(error)).toBe(true);
    expect(isAuthRequiredError(error)).toBe(false);
    expect(error.message).toBe('해당 프로젝트 관리 권한이 없습니다.');
  });
});
