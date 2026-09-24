'use client';

import { create } from 'zustand';
import { ApiError } from '@/components/features/auth/authApi';
import { getMyProfile } from '@/components/features/profile/profileApi';

export type AuthUser = { memberId: number; name: string };

type AuthState = {
  isSessionReady: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  user: AuthUser | null;
  restoreSession: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isSessionReady: false,
  isAuthenticated: false,
  sessionError: null,
  user: null,
  restoreSession: async () => {
    set({ isSessionReady: false, sessionError: null });
    try {
      const profile = await getMyProfile();
      set({
        isSessionReady: true,
        isAuthenticated: true,
        user: { memberId: profile.memberId, name: profile.name },
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        set({ isSessionReady: true, isAuthenticated: false, user: null });
        return;
      }
      set({
        isSessionReady: true,
        isAuthenticated: false,
        user: null,
        sessionError: '로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.',
      });
    }
  },
  setUser: (user) => set({ isSessionReady: true, isAuthenticated: true, sessionError: null, user }),
  clearSession: () =>
    set({ isSessionReady: true, isAuthenticated: false, sessionError: null, user: null }),
}));
