'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

import { isAuthRequiredError } from './authError';
import { getLoginPromptCopy, normalizeProtectedPath } from './protectedPaths';

type AuthRequiredModalOptions = {
  redirectPath?: string;
};

export function useAuthRequiredModal() {
  const pathname = usePathname();
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal);

  return useCallback(
    (error: unknown, options?: AuthRequiredModalOptions) => {
      if (!isAuthRequiredError(error)) {
        return false;
      }

      if (isLoggingOut) {
        return true;
      }

      const redirectPath = normalizeProtectedPath(options?.redirectPath ?? pathname);

      openLoginModal({
        redirectPath,
        ...getLoginPromptCopy(redirectPath),
      });

      return true;
    },
    [isLoggingOut, openLoginModal, pathname],
  );
}
