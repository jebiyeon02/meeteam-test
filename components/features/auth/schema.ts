import { z } from 'zod';

export const signupEmailSchema = z.string().email('올바른 이메일 형식을 입력해 주세요.');
export const loginStudentIdSchema = z
  .string()
  .trim()
  .min(1, '학번을 입력해 주세요.')
  .regex(/^\d+$/, '학번은 숫자만 입력해 주세요.');

export const loginFormSchema = z.object({
  studentId: loginStudentIdSchema,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export const signupFormSchema = z
  .object({
    email: signupEmailSchema,
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해 주세요.'),
    name: z.string().trim().min(1, '이름을 입력해 주세요.'),
    birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일을 선택해 주세요.'),
    gender: z.enum(['male', 'female']),
    githubUrl: z.string(),
    blogUrl: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirm'],
        message: '비밀번호가 일치하지 않습니다.',
      });
    }
  });

export const onboardingFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
  birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일을 선택해 주세요.'),
  gender: z.enum(['male', 'female']),
});

export type SignupFieldErrors = Partial<
  Record<
    | 'email'
    | 'password'
    | 'passwordConfirm'
    | 'name'
    | 'birth'
    | 'githubUrl'
    | 'blogUrl'
    | 'interests'
    | 'emailCheck'
    | 'form',
    string
  >
>;

export type LoginFieldErrors = Partial<
  Record<'studentId' | 'password' | 'agreement' | 'form', string>
>;

export type OnboardingFieldErrors = Partial<
  Record<'name' | 'birth' | 'interests' | 'form', string>
>;
