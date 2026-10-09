'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, Lock, UserRound } from 'lucide-react';

import BaseButton from '@/components/shared/BaseButton';
import BaseInput from '@/components/shared/BaseInput';
import ToastMessage from '@/components/shared/ToastMessage';
import { fetchMyProfile } from '@/components/features/profile/profileApi';
import { useAuthStore } from '@/stores/useAuthStore';
import type { LoginFormValues } from '@/types/auth';

import { loginMember } from './loginApi';
import { saveSejongOnboardingCode } from './sejongOnboardingStorage';
import { loginFormSchema, type LoginFieldErrors } from './schema';

const INITIAL_FORM_VALUES: LoginFormValues = {
  studentId: '',
  password: '',
};

type LoginFormProps = {
  redirectPath?: string;
  onSuccess?: () => void | Promise<void>;
  onSignupRequired?: (signupPath: string) => void | Promise<void>;
};

export default function LoginForm({
  redirectPath = '/',
  onSuccess,
  onSignupRequired,
}: LoginFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [formValues, setFormValues] = useState<LoginFormValues>(INITIAL_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);

  const validateForm = () => {
    const result = loginFormSchema.safeParse(formValues);

    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const flattened = result.error.flatten().fieldErrors;
    setFieldErrors({
      studentId: flattened.studentId?.[0],
      password: flattened.password?.[0],
      agreement: undefined,
    });
    return false;
  };

  const updateField = <K extends keyof LoginFormValues>(key: K, value: LoginFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const updateConsent = (checked: boolean) => {
    setIsConsentChecked(checked);
    setFieldErrors((prev) => ({ ...prev, agreement: undefined, form: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginMember(formValues);

      if (result.isNewMember) {
        if (!result.code) {
          throw new Error('회원가입용 인증 코드가 없습니다. 다시 시도해 주세요.');
        }

        saveSejongOnboardingCode(result.code);
        const signupPath = '/auth/sign-up/sejong';

        if (onSignupRequired) {
          await onSignupRequired(signupPath);
        } else {
          router.push(signupPath);
        }

        return;
      }

      const profile = await fetchMyProfile();
      setSession({
        memberId: profile.memberId,
        name: profile.name,
        email: profile.email,
      });
      await onSuccess?.();

      if (redirectPath !== pathname) {
        router.replace(redirectPath);
      }
    } catch (error) {
      setFieldErrors({
        form: error instanceof Error ? error.message : '로그인에 실패했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex w-full flex-col gap-5"
      noValidate
      onSubmit={handleSubmit}
      data-cy="login-form"
    >
      <ToastMessage message={fieldErrors.form} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="studentId" className="font-bold text-mt-text-primary">
          학번
        </label>
        <BaseInput
          id="studentId"
          type="text"
          value={formValues.studentId}
          onChange={(event) => updateField('studentId', event.target.value)}
          leftIcon={<UserRound className="h-5 w-5" strokeWidth={1.8} />}
          placeholder="학번을 입력해 주세요"
          autoComplete="username"
          aria-invalid={Boolean(fieldErrors.studentId)}
          data-cy="login-student-id"
        />
        {fieldErrors.studentId ? (
          <p className="text-sm text-mt-hero-blue" role="alert">
            {fieldErrors.studentId}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-bold text-mt-text-primary">
          비밀번호
        </label>
        <BaseInput
          id="password"
          type="password"
          value={formValues.password}
          onChange={(event) => updateField('password', event.target.value)}
          leftIcon={<Lock className="h-5 w-5" strokeWidth={1.8} />}
          placeholder="••••••••"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password)}
          data-cy="login-password"
        />
        {fieldErrors.password ? (
          <p className="text-sm text-mt-hero-blue" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-mt-border bg-mt-bg-soft px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3" htmlFor="login-consent">
          <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            <input
              id="login-consent"
              type="checkbox"
              checked={isConsentChecked}
              onChange={(event) => updateConsent(event.target.checked)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  updateConsent(!isConsentChecked);
                }
              }}
              className="peer sr-only"
              data-cy="login-consent"
            />
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-mt-border bg-mt-white text-mt-white transition-colors peer-checked:border-mt-primary peer-checked:bg-mt-primary peer-focus-visible:ring-2 peer-focus-visible:ring-mt-logo-blue/20">
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-sm leading-5 font-semibold text-mt-text-primary">
              비밀번호는 저장하지 않으며, 로그인 후 학교 포털에서 로그아웃됩니다.
            </span>
          </span>
        </label>
        {fieldErrors.agreement ? (
          <p className="mt-2 text-sm text-mt-hero-blue" role="alert">
            {fieldErrors.agreement}
          </p>
        ) : null}
      </div>

      <BaseButton
        size="L"
        full={true}
        type="submit"
        disabled={isSubmitting || !isConsentChecked}
        data-cy="login-submit"
      >
        {isSubmitting ? '로그인 중...' : '로그인'}
      </BaseButton>
    </form>
  );
}
