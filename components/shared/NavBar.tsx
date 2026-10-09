'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Headset } from 'lucide-react';
import { useEffect, useState } from 'react';
import AuthLink from '@/components/features/auth/AuthLink';
import { useNotificationStore } from '@/components/features/notification/store';
import { useNotificationSync } from '@/components/features/notification/useNotificationSync';
import AppLogo from '@/components/shared/AppLogo';
import ProfileMenu from '@/components/shared/ProfileMenu';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

const navItems = [
  { href: '/teammates', label: '팀원 찾기' },
  { href: '/projects', label: '프로젝트 찾기' },
  { href: '/projects/create', label: '프로젝트 등록하기', authRequired: true },
];

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfE0igqGaKFJ-ASXojrFln2OmoQH_v8n9-Y5Mx5Kt2FJVCtOg/viewform?usp=dialog';

export function NavBar() {
  const pathname = usePathname();
  const finishLogout = useAuthStore((state) => state.finishLogout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const isSessionRestoring = useAuthStore((state) => state.isSessionRestoring);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const closeLoginModal = useLoginModalStore((state) => state.closeLoginModal);
  const [isAtTop, setIsAtTop] = useState(true);
  useNotificationSync(isAuthenticated);

  useEffect(() => {
    if (pathname === '/' && isLoggingOut) {
      closeLoginModal();
      finishLogout();
    }
  }, [closeLoginModal, finishLogout, isLoggingOut, pathname]);

  useEffect(() => {
    const updateNavVisibility = () => {
      setIsAtTop(window.scrollY <= 8);
    };

    updateNavVisibility();
    window.addEventListener('scroll', updateNavVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateNavVisibility);
    };
  }, [pathname]);

  const isActiveLink = (href: string) =>
    pathname === href ||
    (href !== '/projects' && pathname.startsWith(`${href}/`)) ||
    (href === '/projects' &&
      pathname.startsWith('/projects') &&
      !pathname.startsWith('/projects/create'));

  return (
    <nav
      className={`sticky top-0 z-40 border-b border-mt-border bg-mt-white/95 backdrop-blur-md transition-transform duration-300 ease-out ${
        isAtTop ? 'translate-y-0' : 'translate-y-0 md:-translate-y-full'
      }`}
    >
      <div className="relative mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-9">
          <Link href="/" className="inline-flex items-center" aria-label="meeTeam 홈">
            <AppLogo className="h-9 w-40 sm:h-10 sm:w-44" priority />
          </Link>

          <ul className="flex list-none items-center gap-3 overflow-x-auto p-0 pb-1 md:gap-4 md:overflow-visible md:pb-0">
            {navItems.map((item) => (
              <li key={item.href} className="shrink-0">
                {item.authRequired ? (
                  <AuthLink
                    className={
                      isActiveLink(item.href)
                        ? 'inline-flex h-10 items-center rounded-full bg-mt-bg-soft px-4 text-base leading-6 font-extrabold text-mt-primary transition-colors'
                        : 'inline-flex h-10 items-center rounded-full px-4 text-base leading-6 font-bold text-mt-text-primary transition-colors hover:bg-mt-bg-soft hover:text-mt-primary'
                    }
                    href={item.href}
                  >
                    {item.label}
                  </AuthLink>
                ) : (
                  <Link
                    className={
                      isActiveLink(item.href)
                        ? 'inline-flex h-10 items-center rounded-full bg-mt-bg-soft px-4 text-base leading-6 font-extrabold text-mt-primary transition-colors'
                        : 'inline-flex h-10 items-center rounded-full px-4 text-base leading-6 font-bold text-mt-text-primary transition-colors hover:bg-mt-bg-soft hover:text-mt-primary'
                    }
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute right-4 top-3 sm:right-6 md:static">
          {isSessionRestoring ? null : isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1">
                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-mt-text-secondary transition-colors hover:bg-mt-border hover:text-mt-primary"
                  aria-label="고객센터 설문"
                  title="고객센터 설문"
                >
                  <Headset className="h-5 w-5" aria-hidden strokeWidth={1.8} />
                </a>
                <Link href="/notifications">
                  <button
                    type="button"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-mt-text-secondary transition-colors hover:bg-mt-border hover:text-mt-primary"
                    aria-label="알림"
                  >
                    <Bell className="h-5 w-5" aria-hidden strokeWidth={1.8} />
                    {unreadCount > 0 ? (
                      <span
                        className="absolute right-2.5 top-2.5 flex min-h-2 min-w-2 items-center justify-center rounded-full border-2 border-mt-white bg-mt-hero-blue"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </Link>
              </div>
              <span className="hidden h-6 w-px bg-mt-border sm:block" aria-hidden />
              <ProfileMenu />
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-mt-border bg-mt-white px-4 text-sm leading-5 font-bold text-mt-primary shadow-sm transition-colors hover:bg-mt-border hover:text-mt-text-primary sm:h-10 sm:px-5"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
