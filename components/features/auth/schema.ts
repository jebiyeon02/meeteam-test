import { z } from 'zod';

export const loginSchema = z.object({
  studentId: z.string().trim().min(1, '학번을 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.').max(50),
  birthDate: z.iso.date({ message: '생년월일을 선택해 주세요.' }),
  gender: z.enum(['MALE', 'FEMALE'], { message: '성별을 선택해 주세요.' }),
  positionId: z.number().positive('관심 직무를 선택해 주세요.'),
  githubUrl: z.union([z.literal(''), z.url({ message: 'GitHub 주소를 확인해 주세요.' })]),
  blogUrl: z.union([z.literal(''), z.url({ message: '블로그 주소를 확인해 주세요.' })]),
});
