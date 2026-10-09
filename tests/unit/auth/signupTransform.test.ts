import { describe, expect, it } from 'vitest';

import type { JobFieldOption, SignupFormValues } from '@/types/auth';

import {
  buildRegisterRequestPayload,
  extractApiData,
  getInterestKey,
  normalizeUrl,
} from '@/components/features/auth/signupTransform';

const JOB_FIELDS: JobFieldOption[] = [
  {
    code: 'BACKEND',
    name: '백엔드',
    positions: [
      { id: 11, code: 'JAVA_SPRING', name: 'Java/Spring' },
      { id: 13, code: 'NODE_NESTJS', name: 'Node.js/NestJS' },
    ],
    techStacks: [
      { id: 1, name: 'Java' },
      { id: 2, name: 'Spring Boot' },
      { id: 3, name: 'NestJS' },
    ],
  },
  {
    code: 'FRONTEND',
    name: '프론트엔드',
    positions: [{ id: 7, code: 'WEB_FRONTEND', name: '웹 프론트엔드' }],
    techStacks: [
      { id: 10, name: 'React' },
      { id: 11, name: 'TypeScript' },
    ],
  },
];

const SIGNUP_VALUES: SignupFormValues = {
  email: 'test@example.com',
  password: 'password123',
  passwordConfirm: 'password123',
  name: '홍길동',
  birth: '1998-03-15',
  gender: 'male',
  interests: [
    { major: 'BACKEND', minor: 'JAVA_SPRING' },
    { major: 'FRONTEND', minor: 'WEB_FRONTEND' },
  ],
  techStacksByInterest: {
    'BACKEND::JAVA_SPRING': ['React', 'Java'],
    'FRONTEND::WEB_FRONTEND': ['TypeScript', 'React'],
  },
  githubUrl: 'github.com/mee-team',
  blogUrl: '',
  profileImage: null,
};

describe('extractApiData', () => {
  it('returns data when backend uses data envelope', () => {
    expect(extractApiData({ data: { fields: JOB_FIELDS } })).toEqual({ fields: JOB_FIELDS });
  });

  it('returns result when backend uses result envelope', () => {
    expect(extractApiData({ result: { exists: true } })).toEqual({ exists: true });
  });

  it('throws when no known envelope is found', () => {
    expect(() => extractApiData({})).toThrow('응답 형식을 해석할 수 없습니다.');
  });
});

describe('normalizeUrl', () => {
  it('adds https when protocol is omitted', () => {
    expect(normalizeUrl('github.com/example')).toBe('https://github.com/example');
  });

  it('returns undefined for empty strings', () => {
    expect(normalizeUrl('   ')).toBeUndefined();
  });
});

describe('buildRegisterRequestPayload', () => {
  it('builds backend payload with enum codes and tech stack display order', () => {
    expect(buildRegisterRequestPayload(SIGNUP_VALUES, JOB_FIELDS)).toEqual({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      birthDate: '1998-03-15',
      gender: 'MALE',
      jobPositions: [
        {
          jobFieldCode: 'BACKEND',
          jobPositionCode: 'JAVA_SPRING',
          techStacks: [
            { id: 10, displayOrder: 1 },
            { id: 1, displayOrder: 2 },
          ],
        },
        {
          jobFieldCode: 'FRONTEND',
          jobPositionCode: 'WEB_FRONTEND',
          techStacks: [
            { id: 11, displayOrder: 1 },
            { id: 10, displayOrder: 2 },
          ],
        },
      ],
      githubUrl: 'https://github.com/mee-team',
    });
  });

  it('throws when selected tech stack cannot be mapped to backend ids', () => {
    expect(() =>
      buildRegisterRequestPayload(
        {
          ...SIGNUP_VALUES,
          techStacksByInterest: {
            [getInterestKey({ major: 'BACKEND', minor: 'JAVA_SPRING' })]: ['Unknown Tech'],
          },
          interests: [{ major: 'BACKEND', minor: 'JAVA_SPRING' }],
        },
        JOB_FIELDS,
      ),
    ).toThrow('선택한 기술 스택을 찾을 수 없습니다.');
  });
});
