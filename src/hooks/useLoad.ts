// src/hooks/useLoad.ts
// 화면 데이터 불러오기 + 다시 시도 (useHome과 같은 모양: phase loading / done / error)

'use client';

import { useEffect, useState } from 'react';

export type LoadState<T> = { phase: 'loading' } | { phase: 'done'; data: T } | { phase: 'error'; error: unknown };

/** load는 화면마다 고정된 함수로 넘겨 주세요 (바뀌어도 다시 부르지 않고, retry로만 다시 부름) */
export function useLoad<T>(load: () => Promise<T>) {
  const [state, setState] = useState<LoadState<T>>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ phase: 'done', data }))
      .catch((error) => !cancelled && setState({ phase: 'error', error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}