'use client';

import { useEffect } from 'react';
import { AUTH_SESSION_EXPIRED_EVENT } from '@/components/features/auth/apiClient';
import { useAuthHydrated } from '@/components/features/auth/useAuthHydrated';
import { fetchMyProfile } from '@/components/features/profile/profileApi';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AuthSessionBootstrap() {
  const hydrated = useAuthHydrated();
  const beginSessionRestore = useAuthStore((state) => state.beginSessionRestore);
  const finishSessionRestore = useAuthStore((state) => state.finishSessionRestore);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  useEffect(() => {
    if (!hydrated) {
      return undefined;
    }

    if (isLoggingOut) {
      finishSessionRestore();
      return undefined;
    }

    let active = true;

    const restoreSession = async () => {
      try {
        beginSessionRestore();

        const profile = await fetchMyProfile();

        if (!active) {
          return;
        }

        setSession({
          memberId: profile.memberId,
          name: profile.name,
          email: profile.email,
        });
      } catch {
        if (active) {
          finishSessionRestore();
        }
      } finally {
        if (active) {
          finishSessionRestore();
        }
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, [beginSessionRestore, finishSessionRestore, hydrated, isLoggingOut, setSession]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [clearSession]);

  return null;
}
