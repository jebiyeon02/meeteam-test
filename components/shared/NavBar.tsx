'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import AppLogo from '@/components/shared/AppLogo';
import { logout } from '@/components/features/auth/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';

const NAV_ITEMS = [
  { href: '/showcase', label: '공통 UI' },
  { href: '/teammates', label: '팀원 찾기' },
  { href: '/projects', label: '프로젝트 찾기' },
  { href: '/projects/create', label: '프로젝트 등록' },
  { href: '/profile', label: '내 프로필' },
];

export function NavBar() {
  const pathname = usePathname();
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);

  async function handleLogout() {
    try {
      await logout();
      clearSession();
      showToast({ tone: 'success', message: '로그아웃했습니다.' });
    } catch {
      showToast({ tone: 'error', message: '로그아웃에 실패했습니다. 다시 시도해 주세요.' });
    }
  }

  return (
    <nav className="border-b border-mt-border bg-mt-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="meeTeam 홈">
          <AppLogo className="h-9 w-40" priority />
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-mt-bg-soft ${pathname === href ? 'bg-mt-badge-bg text-mt-primary' : 'text-mt-text-nav'}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            aria-label="알림"
            className="rounded-full p-2 text-mt-text-nav hover:bg-mt-bg-soft"
          >
            <Bell className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href="/settings"
            aria-label="설정"
            className="rounded-full p-2 text-mt-text-nav hover:bg-mt-bg-soft"
          >
            <Settings className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          {isSessionReady &&
            (user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-mt-text-secondary sm:inline">
                  {user.name}님
                </span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-full border border-mt-border px-4 py-2 text-sm font-semibold text-mt-primary"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full border border-mt-border px-4 py-2 text-sm font-semibold text-mt-primary"
              >
                로그인
              </Link>
            ))}
        </div>
      </div>
    </nav>
  );
}
