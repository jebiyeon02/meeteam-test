'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Headset } from 'lucide-react';
import AppLogo from '@/components/shared/AppLogo';
import { logout } from '@/components/features/auth/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';

const NAV_ITEMS = [
  { href: '/teammates', label: '팀원 찾기' },
  { href: '/projects', label: '프로젝트 찾기' },
  { href: '/projects/create', label: '프로젝트 등록하기' },
];

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfE0igqGaKFJ-ASXojrFln2OmoQH_v8n9-Y5Mx5Kt2FJVCtOg/viewform?usp=dialog';

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      clearSession();
      setIsProfileMenuOpen(false);
      showToast({ tone: 'success', message: '로그아웃했습니다.' });
      router.push('/');
    } catch {
      showToast({ tone: 'error', message: '로그아웃에 실패했습니다. 다시 시도해 주세요.' });
    }
  }

  function isActive(href: string) {
    if (href === '/projects')
      return pathname.startsWith('/projects') && !pathname.startsWith('/projects/create');
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-mt-border bg-mt-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:gap-4 md:py-0 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 md:gap-9">
          <Link href="/" className="inline-flex items-center" aria-label="meeTeam 홈">
            <AppLogo className="h-9 w-40 sm:h-10 sm:w-44" priority />
          </Link>
          <ul className="flex list-none items-center gap-3 overflow-x-auto p-0 pb-1 md:gap-4 md:overflow-visible md:pb-0">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`inline-flex h-10 items-center rounded-full px-4 text-base leading-6 transition-colors ${
                    isActive(href)
                      ? 'bg-mt-bg-soft font-extrabold text-mt-primary'
                      : 'font-bold text-mt-text-primary hover:bg-mt-bg-soft hover:text-mt-primary'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="ml-auto shrink-0">
          {isSessionReady &&
            (user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="고객센터 설문"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-mt-text-secondary hover:bg-mt-bg-soft"
                >
                  <Headset className="h-5 w-5" aria-hidden strokeWidth={1.8} />
                </a>
                <Link
                  href="/notifications"
                  aria-label="알림"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-mt-text-secondary hover:bg-mt-bg-soft"
                >
                  <Bell className="h-5 w-5" aria-hidden strokeWidth={1.8} />
                </Link>
                <span className="hidden h-6 w-px bg-mt-border sm:block" aria-hidden />
                <div className="relative">
                  <button
                    type="button"
                    aria-label="프로필 메뉴"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((open) => !open)}
                    className="flex h-10 items-center gap-2 rounded-full border border-mt-border bg-mt-white pl-1 pr-3 text-sm font-bold text-mt-text-primary shadow-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mt-badge-bg text-mt-primary">
                      {user.name.slice(0, 1)}
                    </span>
                    <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
                    <ChevronDown className="h-4 w-4 text-mt-text-secondary" aria-hidden />
                  </button>
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-mt-border bg-mt-white py-1 shadow-lg">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-mt-bg-soft"
                      >
                        내 프로필
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-mt-bg-soft"
                      >
                        설정
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-mt-bg-soft"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex h-10 items-center justify-center rounded-full border border-mt-border bg-mt-white px-5 text-sm font-bold text-mt-primary shadow-sm hover:bg-mt-bg-soft"
              >
                로그인
              </Link>
            ))}
        </div>
      </div>
    </nav>
  );
}
