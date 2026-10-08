'use client';

import { useEffect, useState } from 'react';

export function useProjectRequest<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data: T | null; error: unknown; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setState({ data: null, error: null, loading: true });
      try {
        const data = await load();
        if (active) setState({ data, error: null, loading: false });
      } catch (error) {
        if (active) setState({ data: null, error, loading: false });
      }
    });
    return () => {
      active = false;
    };
  }, [load, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
