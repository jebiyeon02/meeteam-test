import { describe, expect, it } from 'vitest';

import { loginFormSchema, signupFormSchema } from '@/components/features/auth/schema';

describe('loginFormSchema', () => {
  it('학번과 비밀번호가 있으면 로그인 입력값을 허용한다', () => {
    expect(
      loginFormSchema.safeParse({
        studentId: '21013220',
        password: 'password123',
      }).success,
    ).toBe(true);
  });

  it('학번은 숫자만 허용한다', () => {
    const result = loginFormSchema.safeParse({
      studentId: '21A13220',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.studentId).toEqual(['학번은 숫자만 입력해 주세요.']);
  });

  it('빈 학번과 빈 비밀번호를 거부한다', () => {
    const result = loginFormSchema.safeParse({
      studentId: '',
      password: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.studentId).toContain('학번을 입력해 주세요.');
    expect(result.error?.flatten().fieldErrors.password).toEqual(['비밀번호를 입력해 주세요.']);
  });
});

describe('signupFormSchema', () => {
  const validSignupValues = {
    email: 'hello@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
    name: '홍길동',
    birth: '1998-03-15',
    gender: 'male',
    githubUrl: '',
    blogUrl: '',
  };

  it('기본 회원가입 필수값을 허용한다', () => {
    expect(signupFormSchema.safeParse(validSignupValues).success).toBe(true);
  });

  it('이메일 형식과 비밀번호 길이를 검증한다', () => {
    const result = signupFormSchema.safeParse({
      ...validSignupValues,
      email: 'not-email',
      password: 'short',
      passwordConfirm: 'short',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      email: ['올바른 이메일 형식을 입력해 주세요.'],
      password: ['비밀번호는 8자 이상이어야 합니다.'],
    });
  });

  it('비밀번호 확인이 일치하지 않으면 오류를 반환한다', () => {
    const result = signupFormSchema.safeParse({
      ...validSignupValues,
      passwordConfirm: 'different123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.passwordConfirm).toEqual([
      '비밀번호가 일치하지 않습니다.',
    ]);
  });

  it('프로젝트 경험 횟수 없이 회원가입 입력값을 허용한다', () => {
    expect(signupFormSchema.safeParse(validSignupValues).success).toBe(true);
  });
});
