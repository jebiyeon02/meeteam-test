'use client';

import { useEffect, useState } from 'react';
import MockApiProvider from '@/components/features/auth/MockApiProvider';
import BaseButton from '@/components/shared/BaseButton';

function RealApiBootstrap({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');

  useEffect(() => {
    let active = true;
    async function removeOldMockWorker() {
      if (!('serviceWorker' in navigator)) {
        if (active) setStatus('ready');
        return;
      }
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const mockRegistrations = registrations.filter((registration) =>
          registration.active?.scriptURL.endsWith('/mockServiceWorker.js'),
        );
        await Promise.all(mockRegistrations.map((registration) => registration.unregister()));
        if (navigator.serviceWorker.controller?.scriptURL.endsWith('/mockServiceWorker.js')) {
          window.location.reload();
          return;
        }
        if (active) setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    }
    void removeOldMockWorker();
    return () => {
      active = false;
    };
  }, []);

  if (status === 'starting') {
    return (
      <p className="p-6 text-center text-sm text-mt-text-secondary">
        API 연결을 준비하고 있습니다...
      </p>
    );
  }
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <p role="alert" className="text-mt-danger">
          기존 데모 연결을 정리하지 못했습니다.
        </p>
        <BaseButton onClick={() => window.location.reload()}>다시 시도</BaseButton>
      </div>
    );
  }
  return <>{children}</>;
}

export default function ApiProvider({ children }: { children: React.ReactNode }) {
  return process.env.NEXT_PUBLIC_API_MODE === 'mock' ? (
    <MockApiProvider>{children}</MockApiProvider>
  ) : (
    <RealApiBootstrap>{children}</RealApiBootstrap>
  );
}
