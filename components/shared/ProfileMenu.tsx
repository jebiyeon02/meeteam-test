'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, FileText, LogOut, Settings, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { logoutMember } from '@/components/features/auth/loginApi';
import { fetchMyProfile } from '@/components/features/profile/profileApi';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

const MENU_ITEMS = [
  {
    href: '/profile',
    label: '내 프로필',
    icon: UserRound,
  },
  {
    href: '/profile/applications',
    label: '내 지원서',
    icon: FileText,
  },
  {
    href: '/settings',
    label: '계정 설정',
    icon: Settings,
  },
] as const;

export default function ProfileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const beginLogout = useAuthStore((state) => state.beginLogout);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setProfileIdentity = useAuthStore((state) => state.setProfileIdentity);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const name = useAuthStore((state) => state.name);
  const email = useAuthStore((state) => state.email);
  const closeLoginModal = useLoginModalStore((state) => state.closeLoginModal);

  const [open, setOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const userName = name?.trim() || 'meeTeam 사용자';
  const userEmail = email?.trim() || '로그인 후 이용해주세요';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const shouldSyncIdentity = !name?.trim() || name === email || name.includes('@');
    const shouldSyncProfileImage = profileImageUrl === null;

    if (!isAuthenticated || (!shouldSyncIdentity && !shouldSyncProfileImage)) {
      return;
    }

    let cancelled = false;

    const syncIdentity = async () => {
      try {
        const profile = await fetchMyProfile();

        if (cancelled) {
          return;
        }

        setProfileIdentity({
          name: profile.name,
          email: profile.email,
        });
        setProfileImageUrl(profile.profileImageUrl);
      } catch {
        // Keep the persisted login identity if profile fetch fails.
      }
    };

    void syncIdentity();

    return () => {
      cancelled = true;
    };
  }, [email, isAuthenticated, name, profileImageUrl, setProfileIdentity]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileImageUrl(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleLogout = async () => {
    beginLogout();

    try {
      await logoutMember();
    } catch {
      // Clear local session even if backend logout fails.
    } finally {
      closeLoginModal();
      clearSession();
      setProfileImageUrl(null);
      setOpen(false);
      router.replace('/');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="프로필 메뉴"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ProfileAvatar name={userName} imageUrl={profileImageUrl} sizeClassName="h-9 w-9" />
        <ChevronDown
          className={`h-4 w-4 text-mt-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
          strokeWidth={1.8}
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-mt-border bg-mt-white shadow-xl"
          role="menu"
          aria-label="프로필 메뉴 목록"
        >
          <div className="border-b border-mt-bg-soft bg-mt-bg-soft/50 px-5 py-4">
            <p className="text-sm leading-5 font-bold text-mt-text-primary">{userName}</p>
            <p className="mt-0.5 text-xs leading-4 text-mt-text-secondary">{userEmail}</p>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex h-10 items-center gap-2.5 rounded-xl px-3 transition-colors hover:bg-mt-bg-soft"
                role="menuitem"
              >
                <Icon className="h-4 w-4 text-mt-text-nav" aria-hidden strokeWidth={1.8} />
                <span className="text-sm leading-5 font-medium text-mt-text-nav">{label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-mt-bg-soft px-2 py-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left transition-colors hover:bg-mt-bg-soft"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 text-mt-hero-blue" aria-hidden strokeWidth={1.8} />
              <span className="text-sm leading-5 font-bold text-mt-hero-blue">로그아웃</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
