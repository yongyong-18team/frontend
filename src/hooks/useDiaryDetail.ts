// src/hooks/useDiaryDetail.ts
// 2.3 검토에서 쓰는 일기 상세 (DIARY-04). 분석 요청은 하지 않습니다.

'use client';

import { useEffect, useState } from 'react';

import { getDiaryDetail, type DiaryDetail } from '@/lib/api/diary';

export type DiaryDetailState =
  | { phase: 'loading' }
  | { phase: 'done'; detail: DiaryDetail }
  | { phase: 'error'; error: unknown };

export function useDiaryDetail(diaryId: number) {
  const [state, setState] = useState<DiaryDetailState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDiaryDetail(diaryId)
      .then((detail) => !cancelled && setState({ phase: 'done', detail }))
      .catch((error) => !cancelled && setState({ phase: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [diaryId, attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
