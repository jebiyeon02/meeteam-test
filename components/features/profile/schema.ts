import { z } from 'zod';

const OPTIONAL_URL = z.union([
  z.literal(''),
  z
    .url({ message: '올바른 링크를 입력해 주세요.' })
    .refine((value) => /^https?:\/\//.test(value), 'http:// 또는 https://로 시작해 주세요.'),
]);

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요.')
    .max(50, '이름은 50자 이하로 입력해 주세요.'),
  age: z
    .string()
    .trim()
    .regex(/^\d+$/, '나이를 숫자로 입력해 주세요.')
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 150,
      '나이는 1~150세로 입력해 주세요.',
    ),
  gender: z.enum(['MALE', 'FEMALE'], { message: '성별을 선택해 주세요.' }),
  jobPositionIds: z.array(z.number()).min(1, '관심 직군을 하나 이상 선택해 주세요.'),
  techStackIds: z.array(z.number()).min(1, '기술 스택을 하나 이상 선택해 주세요.'),
  isParticipating: z.boolean(),
  introduction: z.string().max(1000, '자기소개는 1000자 이하로 입력해 주세요.'),
  githubUrl: OPTIONAL_URL,
  blogUrl: OPTIONAL_URL,
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
