'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMyProfile } from '@/components/features/profile/profileApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

import { getLoginPromptCopy, isProtectedPath, normalizeProtectedPath } from './protectedPaths';
import { useAuthHydrated } from './useAuthHydrated';

export function useProtectedNavigation() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionRestoring = useAuthStore((state) => state.isSessionRestoring);
  const setSession = useAuthStore((state) => state.setSession);
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal);

  const openAuthRequiredModal = useCallback(
    (path: string) => {
      const normalizedPath = normalizeProtectedPath(path);

      openLoginModal({
        redirectPath: normalizedPath,
        ...getLoginPromptCopy(normalizedPath),
      });
    },
    [openLoginModal],
  );

  const ensureBackendSession = useCallback(
    async (path: string) => {
      if (isAuthenticated) {
        return true;
      }

      if (isSessionRestoring) {
        return false;
      }

      try {
        const profile = await fetchMyProfile();

        setSession({
          memberId: profile.memberId,
          name: profile.name,
          email: profile.email,
        });

        return true;
      } catch {
        openAuthRequiredModal(path);
        return false;
      }
    },
    [isAuthenticated, isSessionRestoring, openAuthRequiredModal, setSession],
  );

  const maybeOpenLoginModal = useCallback(
    (path: string) => {
      const normalizedPath = normalizeProtectedPath(path);

      if (!isProtectedPath(normalizedPath)) {
        return false;
      }

      if (!hydrated || isSessionRestoring) {
        return false;
      }

      if (isAuthenticated) {
        return false;
      }

      openAuthRequiredModal(normalizedPath);

      return true;
    },
    [hydrated, isAuthenticated, isSessionRestoring, openAuthRequiredModal],
  );

  const navigateWithProtection = useCallback(
    async (path: string) => {
      const normalizedPath = normalizeProtectedPath(path);

      if (!isProtectedPath(normalizedPath)) {
        router.push(path);
        return true;
      }

      if (!hydrated || isSessionRestoring) {
        return false;
      }

      const canNavigate = await ensureBackendSession(normalizedPath);

      if (!canNavigate) {
        return false;
      }

      router.push(path);
      return true;
    },
    [ensureBackendSession, hydrated, isSessionRestoring, router],
  );

  return {
    hydrated,
    isAuthenticated,
    isSessionRestoring,
    maybeOpenLoginModal,
    navigateWithProtection,
  };
}
