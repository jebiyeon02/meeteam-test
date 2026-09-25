'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import { loginSejong } from '@/components/features/auth/authApi';
import { loginSchema } from '@/components/features/auth/schema';
import { getMyProfile } from '@/components/features/profile/profileApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';

function getReturnPath() {
  const path = new URLSearchParams(window.location.search).get('next');
  return path?.startsWith('/') && !path.startsWith('//') ? path : '/profile';
}

export default function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.showToast);
  const [studentId, setStudentId] = useState('20260001');
  const [password, setPassword] = useState('demo1234');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ studentId, password });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])),
      );
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await loginSejong(parsed.data.studentId, parsed.data.password);
      if (result.isNewMember) {
        if (!result.code) throw new Error('회원가입 인증 코드를 받지 못했습니다.');
        sessionStorage.setItem('sejongRegistrationCode', result.code);
        router.push('/auth/sign-up/sejong');
        return;
      }
      const profile = await getMyProfile();
      setUser({ memberId: profile.memberId, name: profile.name });
      showToast({ tone: 'success', message: '로그인했습니다.' });
      router.replace(getReturnPath());
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setErrors({ form: message });
      showToast({ tone: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-mt-border bg-mt-white p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">데모 로그인</h1>
        <p className="text-sm text-mt-text-secondary">
          현재는 MSW 데모입니다. 실제 포털 계정 정보를 입력하지 마세요.
        </p>
        <p className="rounded-xl bg-mt-bg-soft p-3 text-sm text-mt-text-secondary">
          기존 회원: 20260001 / demo1234
          <br />
          신규 가입 체험: 20260002 / demo1234
        </p>
      </div>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate>
        <BaseField label="데모 학번" htmlFor="studentId" errorText={errors.studentId}>
          <BaseInput
            id="studentId"
            autoComplete="off"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            aria-invalid={Boolean(errors.studentId)}
          />
        </BaseField>
        <BaseField label="데모 비밀번호" htmlFor="password" errorText={errors.password}>
          <BaseInput
            id="password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
        </BaseField>
        {errors.form && (
          <p role="alert" className="text-sm text-mt-danger">
            {errors.form}
          </p>
        )}
        <BaseButton type="submit" full disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </BaseButton>
      </form>
      <p className="text-center text-sm text-mt-text-secondary">
        신규 가입 화면은 위의 신규 가입 데모 학번으로 로그인하면 열립니다.
      </p>
      <Link href="/" className="block text-center text-sm font-semibold text-mt-primary">
        홈으로 돌아가기
      </Link>
    </section>
  );
}
