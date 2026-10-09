'use client';

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

export function useAuthHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => useAuthStore.persist?.hasHydrated() ?? true,
    () => false,
  );
}

function subscribe(onChange: () => void) {
  const begin = useAuthStore.persist?.onHydrate(onChange);
  const finish = useAuthStore.persist?.onFinishHydration(onChange);
  return () => {
    begin?.();
    finish?.();
  };
}
