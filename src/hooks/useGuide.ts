// src/hooks/useGuide.ts
// 3.1 설명서 (GUIDE-01), 3.2 편집 (GUIDE-01 + SUBJ-02) 불러오기 + 다시 시도

'use client';

import { useEffect, useState } from 'react';

import { getGuide, getSubject, type GuideData, type SubjectData } from '@/lib/api/guide';

export type LoadState<T> = { phase: 'loading' } | { phase: 'done'; data: T } | { phase: 'error'; error: unknown };

function useLoad<T>(load: () => Promise<T>) {
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
    // load는 화면마다 고정된 함수라 attempt만 봄
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}

/** 3.1 설명서 */
export function useGuide() {
  return useLoad<GuideData>(getGuide);
}

/** 3.2 편집: 대상자 정보 + 설명서를 함께 */
export function useGuideEdit() {
  return useLoad<{ guide: GuideData; subject: SubjectData }>(async () => {
    const [guide, subject] = await Promise.all([getGuide(), getSubject()]);
    return { guide, subject };
  });
}