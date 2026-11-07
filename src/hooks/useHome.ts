// src/hooks/useHome.ts
// 1.1 홈 데이터 (HOME-01) 불러오기 + 다시 시도

'use client';

import { useEffect, useState } from 'react';

import { getHome, type HomeData } from '@/lib/api/home';

export type HomeState =
  | { phase: 'loading' }
  | { phase: 'done'; data: HomeData }
  | { phase: 'error'; error: unknown };

export function useHome() {
  const [state, setState] = useState<HomeState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getHome()
      .then((data) => !cancelled && setState({ phase: 'done', data }))
      .catch((error) => !cancelled && setState({ phase: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
