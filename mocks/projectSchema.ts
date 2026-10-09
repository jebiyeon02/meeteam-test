import { z } from 'zod';
import { todayLocalDate } from '@/mocks/projectContract';
import { JOB_OPTIONS } from './fixtures';

export const backendProjectCreateSchema = z
  .object({
    projectName: z.string(),
    projectCategory: z.enum(['CAPSTONE', 'CREATIVE_SEMESTER', 'CLUB', 'ETC']),
    platformCategory: z.enum(['WEB', 'IOS', 'ANDROID']),
    description: z.string(),
    githubRepositoryUrl: z.string().optional(),
    communicationChannelUrl: z.string().optional(),
    creatorJobPositionCode: z.string(),
    recruitments: z.array(
      z.object({
        jobFieldCode: z.string(),
        jobPositionCode: z.string(),
        recruitmentCount: z.number(),
        techStackIds: z.array(z.number()),
      }),
    ),
    recruitmentDeadlineType: z.enum(['END_DATE', 'RECRUITMENT_COMPLETED']),
    endDate: z.string().optional(),
  })
  .transform((value) => ({
    name: value.projectName,
    category: value.projectCategory,
    platform: value.platformCategory,
    description: value.description,
    githubUrl: value.githubRepositoryUrl ?? '',
    communicationUrl: value.communicationChannelUrl ?? '',
    leaderPositionId:
      JOB_OPTIONS.fields
        .flatMap((field) => field.positions)
        .find((item) => item.code === value.creatorJobPositionCode)?.id ?? 0,
    recruitments: value.recruitments.map((item) => ({
      jobFieldCode: item.jobFieldCode,
      jobPositionId:
        JOB_OPTIONS.fields
          .flatMap((field) => field.positions)
          .find((position) => position.code === item.jobPositionCode)?.id ?? 0,
      count: item.recruitmentCount,
      techStackIds: item.techStackIds,
    })),
    deadline: value.endDate ?? null,
    closeWhenFull: value.recruitmentDeadlineType === 'RECRUITMENT_COMPLETED',
  }));

const optionalUrl = z.union([
  z.literal(''),
  z.url({ protocol: /^https?$/, error: 'http:// 또는 https://로 시작하는 링크를 입력해 주세요.' }),
]);

export const projectCreateSchema = z
  .object({
    name: z.string().trim().min(2, '프로젝트명은 2자 이상 입력해 주세요.').max(60),
    category: z.enum(['CAPSTONE', 'CREATIVE_SEMESTER', 'CLUB', 'ETC']),
    platform: z.enum(['WEB', 'IOS', 'ANDROID']),
    description: z.string().trim().min(10, '소개는 10자 이상 입력해 주세요.').max(5000),
    githubUrl: optionalUrl.refine(
      (value) =>
        !value || /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(value),
      'GitHub 저장소 주소를 입력해 주세요.',
    ),
    communicationUrl: optionalUrl.refine(
      (value) =>
        !value ||
        /^https:\/\/(discord\.gg\/[A-Za-z0-9]+|discord\.com\/invite\/[A-Za-z0-9]+|join\.slack\.com\/t\/[A-Za-z0-9/_-]+|[A-Za-z0-9-]+\.slack\.com|open\.kakao\.com\/o\/[A-Za-z0-9]+)\/?$/.test(
          value,
        ),
      '디스코드·슬랙·카카오톡 오픈채팅 링크를 입력해 주세요.',
    ),
    leaderPositionId: z.number().int().positive('리더의 직무를 선택해 주세요.'),
    recruitments: z
      .array(
        z.object({
          jobFieldCode: z.string().min(1, '모집 직군을 선택해 주세요.'),
          jobPositionId: z.number().int().positive('모집 직무를 선택해 주세요.'),
          count: z.number().int().min(1, '모집 인원은 1명 이상이어야 해요.').max(20),
          techStackIds: z.array(z.number().int()).min(1, '기술 스택을 하나 이상 선택해 주세요.'),
        }),
      )
      .min(1, '모집 직무를 하나 이상 추가해 주세요.'),
    deadline: z.string().nullable(),
    closeWhenFull: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.closeWhenFull) {
      if (!value.deadline) {
        context.addIssue({
          code: 'custom',
          path: ['deadline'],
          message: '모집 마감일을 선택해 주세요.',
        });
      } else if (value.deadline < todayLocalDate()) {
        context.addIssue({
          code: 'custom',
          path: ['deadline'],
          message: '지난 날짜는 선택할 수 없어요.',
        });
      }
    }
    const seen = new Set<number>();
    value.recruitments.forEach((item, index) => {
      if (seen.has(item.jobPositionId)) {
        context.addIssue({
          code: 'custom',
          path: ['recruitments', index],
          message: '같은 모집 직무는 한 번만 추가할 수 있어요.',
        });
      }
      seen.add(item.jobPositionId);
    });
  });

export type ProjectCreateValues = z.input<typeof projectCreateSchema>;

export const projectCoverSchema = z
  .instanceof(File)
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'JPG, PNG, WebP 이미지만 선택할 수 있어요.',
  )
  .refine((file) => file.size <= 2 * 1024 * 1024, '이미지는 2MB 이하로 선택해 주세요.');
