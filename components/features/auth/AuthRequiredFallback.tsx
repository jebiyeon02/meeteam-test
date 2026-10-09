'use client';

import Link from 'next/link';

import AppLogo from '@/components/shared/AppLogo';

type AuthRequiredFallbackProps = {
  title?: string;
};

export default function AuthRequiredFallback({
  title = '로그인이 필요한 기능입니다',
}: AuthRequiredFallbackProps) {
  return (
    <section className="mx-auto flex min-h-[420px] w-full max-w-3xl items-center justify-center px-4 py-16 text-center">
      <div className="w-full rounded-3xl border border-mt-border bg-mt-white px-6 py-10 shadow-sm">
        <div className="flex justify-center">
          <AppLogo className="h-9 w-40" />
        </div>
        <h1 className="mt-2 text-2xl leading-8 font-extrabold text-mt-text-primary">{title}</h1>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-mt-border bg-mt-white px-5 text-sm leading-5 font-bold text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
