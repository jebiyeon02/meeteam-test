import { z } from 'zod';

const recruitInterestSchema = z
  .object({
    major: z.string().min(1, '모집 분야의 직군을 선택해 주세요.'),
    minor: z.string().min(1, '모집 분야의 상세 직무를 선택해 주세요.'),
    count: z.number().int().min(1, '모집 인원은 1명 이상이어야 해요.'),
    minRecruitmentCount: z.number().int().min(0).optional(),
  })
  .superRefine((value, ctx) => {
    const minRecruitmentCount = value.minRecruitmentCount ?? 1;

    if (value.count < minRecruitmentCount) {
      ctx.addIssue({
        code: 'custom',
        path: ['count'],
        message: '현재 승인된 인원보다 적게 설정할 수 없어요.',
      });
    }
  });

export const projectFormSchema = z
  .object({
    projectName: z.string().trim().min(1, '프로젝트 이름을 입력해 주세요.'),
    categoryId: z.string().min(1, '프로젝트 카테고리를 선택해 주세요.'),
    description: z.string().max(5000, '프로젝트 소개는 5,000자 이하로 입력해 주세요.'),
    releasePlatforms: z
      .array(z.enum(['웹', 'iOS', '안드로이드']))
      .min(1, '출시 플랫폼을 선택해 주세요.')
      .max(1, '출시 플랫폼은 1개만 선택할 수 있어요.'),
    myInterest: z.object({
      major: z.string().min(1, '나의 분야를 선택해 주세요.'),
      minor: z.string().min(1, '나의 상세 분야를 선택해 주세요.'),
    }),
    recruitInterests: z
      .array(recruitInterestSchema)
      .min(1, '최소 1개의 모집 분야를 추가해 주세요.'),
    recruitDeadline: z.string(),
    isRecruitUntilComplete: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.isRecruitUntilComplete && !value.recruitDeadline) {
      ctx.addIssue({
        code: 'custom',
        path: ['recruitDeadline'],
        message: '모집 마감일을 선택해 주세요.',
      });
    }

    const recruitmentKeys = new Map<string, number>();

    value.recruitInterests.forEach((interest, index) => {
      if (!interest.major || !interest.minor) {
        return;
      }

      const key = `${interest.major}:${interest.minor}`;
      const previousIndex = recruitmentKeys.get(key);

      if (previousIndex !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['recruitInterests', index, 'minor'],
          message: '같은 모집 분야는 한 번만 추가할 수 있어요.',
        });
        ctx.addIssue({
          code: 'custom',
          path: ['recruitInterests', previousIndex, 'minor'],
          message: '같은 모집 분야는 한 번만 추가할 수 있어요.',
        });
        return;
      }

      recruitmentKeys.set(key, index);
    });
  });

export type ProjectFormFieldErrors = Partial<
  Record<
    | 'projectName'
    | 'githubUrl'
    | 'communicationUrl'
    | 'categoryId'
    | 'description'
    | 'releasePlatforms'
    | 'myInterest'
    | 'recruitInterests'
    | 'recruitTechStacks'
    | 'recruitDeadline'
    | 'form',
    string
  >
>;
