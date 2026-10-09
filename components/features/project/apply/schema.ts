import { z } from 'zod';

export const projectApplicationSchema = z.object({
  jobPositionCode: z.string().min(1, '지원할 포지션을 선택해 주세요.'),
  motivation: z
    .string()
    .trim()
    .min(10, '지원 사유를 10자 이상 입력해 주세요.')
    .max(1000, '지원 사유는 1000자 이하로 입력해 주세요.'),
});

export type ProjectApplicationFormValues = z.infer<typeof projectApplicationSchema>;
