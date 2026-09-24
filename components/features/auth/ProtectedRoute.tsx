'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BaseButton from '@/components/shared/BaseButton';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

function isProtectedPath(pathname: string) {
  return (
    pathname === '/profile' ||
    pathname.startsWith('/profile/applications') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/projects/create') ||
    /^\/projects\/[^/]+\/(apply|manage)(\/|$)/.test(pathname)
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionError = useAuthStore((state) => state.sessionError);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal);
  const protectedPath = isProtectedPath(pathname);

  useEffect(() => {
    if (protectedPath && isSessionReady && !isAuthenticated && !sessionError) {
      openLoginModal({ redirectPath: pathname });
    }
  }, [isAuthenticated, isSessionReady, openLoginModal, pathname, protectedPath, sessionError]);

  if (!protectedPath) return <>{children}</>;

  if (!isSessionReady) {
    return (
      <section className="space-y-4" aria-label="로그인 상태 확인 중">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-40 w-full" />
      </section>
    );
  }

  if (sessionError) {
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-mt-border bg-mt-white p-8 text-center">
        <h1 className="text-xl font-bold">로그인 상태를 확인할 수 없습니다</h1>
        <p role="alert" className="text-sm text-mt-text-secondary">
          {sessionError}
        </p>
        <BaseButton onClick={() => void restoreSession()}>다시 시도</BaseButton>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-mt-border bg-mt-white p-8 text-center">
        <h1 className="text-xl font-bold">로그인이 필요한 화면입니다</h1>
        <p className="text-sm text-mt-text-secondary">로그인 후 이 화면을 이용할 수 있습니다.</p>
        <Link
          href={`/auth/login?next=${encodeURIComponent(pathname)}`}
          className="inline-flex rounded-xl bg-mt-primary px-4 py-2 text-sm font-bold text-mt-white"
        >
          로그인하기
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
