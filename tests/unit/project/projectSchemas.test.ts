import { describe, expect, it } from 'vitest';

import { projectApplicationSchema } from '@/components/features/project/apply/schema';
import { projectFormSchema } from '@/components/features/project/create/schema';

const VALID_PROJECT_FORM_VALUES = {
  projectName: 'QA 스키마 테스트 프로젝트',
  categoryId: 'capstone',
  description: '프로젝트 설명입니다.',
  releasePlatforms: ['웹'],
  myInterest: {
    major: '프론트엔드',
    minor: '웹 프론트엔드',
  },
  recruitInterests: [
    {
      major: '백엔드',
      minor: 'Node.js/NestJS',
      count: 1,
    },
  ],
  recruitDeadline: '2026-06-30',
  isRecruitUntilComplete: false,
};

describe('projectFormSchema', () => {
  it('프로젝트 등록/수정에 필요한 최소 필수값을 허용한다', () => {
    expect(projectFormSchema.safeParse(VALID_PROJECT_FORM_VALUES).success).toBe(true);
  });

  it('마감일 방식인데 마감일이 비어 있으면 오류를 반환한다', () => {
    const result = projectFormSchema.safeParse({
      ...VALID_PROJECT_FORM_VALUES,
      recruitDeadline: '',
      isRecruitUntilComplete: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.recruitDeadline).toEqual([
      '모집 마감일을 선택해 주세요.',
    ]);
  });

  it('상시 모집이면 마감일이 없어도 허용한다', () => {
    expect(
      projectFormSchema.safeParse({
        ...VALID_PROJECT_FORM_VALUES,
        recruitDeadline: '',
        isRecruitUntilComplete: true,
      }).success,
    ).toBe(true);
  });

  it('출시 플랫폼은 하나만 선택할 수 있다', () => {
    const result = projectFormSchema.safeParse({
      ...VALID_PROJECT_FORM_VALUES,
      releasePlatforms: ['웹', 'iOS'],
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.releasePlatforms).toEqual([
      '출시 플랫폼은 1개만 선택할 수 있어요.',
    ]);
  });

  it('모집 인원은 1명 이상이어야 한다', () => {
    const result = projectFormSchema.safeParse({
      ...VALID_PROJECT_FORM_VALUES,
      recruitInterests: [
        {
          major: '백엔드',
          minor: 'Node.js/NestJS',
          count: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.recruitInterests?.[0]).toContain(
      '모집 인원은 1명 이상이어야 해요.',
    );
  });

  it('[EX-001] 수정 중 모집 인원은 현재 승인된 인원보다 작을 수 없다', () => {
    const result = projectFormSchema.safeParse({
      ...VALID_PROJECT_FORM_VALUES,
      recruitInterests: [
        {
          major: '백엔드',
          minor: 'Node.js/NestJS',
          count: 2,
          minRecruitmentCount: 3,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      '현재 승인된 인원보다 적게 설정할 수 없어요.',
    );
  });

  it('[EX-002][EX-003] 수정 중 모집 인원은 현재 승인된 인원 이상이면 허용한다', () => {
    for (const count of [3, 5]) {
      expect(
        projectFormSchema.safeParse({
          ...VALID_PROJECT_FORM_VALUES,
          recruitInterests: [
            {
              major: '백엔드',
              minor: 'Node.js/NestJS',
              count,
              minRecruitmentCount: 3,
            },
          ],
        }).success,
      ).toBe(true);
    }
  });

  it('같은 모집 분야를 중복으로 추가할 수 없다', () => {
    const result = projectFormSchema.safeParse({
      ...VALID_PROJECT_FORM_VALUES,
      recruitInterests: [
        {
          major: '백엔드',
          minor: 'Node.js/NestJS',
          count: 1,
        },
        {
          major: '백엔드',
          minor: 'Node.js/NestJS',
          count: 2,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      '같은 모집 분야는 한 번만 추가할 수 있어요.',
    );
  });
});

describe('projectApplicationSchema', () => {
  it('지원 포지션과 10자 이상 지원동기를 허용한다', () => {
    expect(
      projectApplicationSchema.safeParse({
        jobPositionCode: 'WEB_FRONTEND',
        motivation: '프론트엔드 경험으로 프로젝트에 기여하고 싶습니다.',
      }).success,
    ).toBe(true);
  });

  it('지원 포지션이 없으면 오류를 반환한다', () => {
    const result = projectApplicationSchema.safeParse({
      jobPositionCode: '',
      motivation: '지원동기는 충분히 길게 입력했습니다.',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.jobPositionCode).toEqual([
      '지원할 포지션을 선택해 주세요.',
    ]);
  });

  it('지원동기는 10자 이상이어야 한다', () => {
    const result = projectApplicationSchema.safeParse({
      jobPositionCode: 'WEB_FRONTEND',
      motivation: '짧아요',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.motivation).toEqual([
      '지원 사유를 10자 이상 입력해 주세요.',
    ]);
  });

  it('지원동기는 1000자를 초과할 수 없다', () => {
    const result = projectApplicationSchema.safeParse({
      jobPositionCode: 'WEB_FRONTEND',
      motivation: '가'.repeat(1001),
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.motivation).toEqual([
      '지원 사유는 1000자 이하로 입력해 주세요.',
    ]);
  });
});
