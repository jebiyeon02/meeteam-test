'use client';

import { useEffect, useState } from 'react';
import BaseButton from '@/components/shared/BaseButton';

export default function MockApiProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');

  useEffect(() => {
    let active = true;
    import('@/mocks/browser')
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        if (active) setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  if (status === 'starting') {
    return (
      <p className="p-6 text-center text-sm text-mt-text-secondary">
        데모 데이터를 준비하고 있습니다...
      </p>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <p role="alert" className="text-mt-danger">
          데모 API를 시작하지 못했습니다.
        </p>
        <BaseButton onClick={() => window.location.reload()}>다시 시도</BaseButton>
      </div>
    );
  }

  return <>{children}</>;
}
