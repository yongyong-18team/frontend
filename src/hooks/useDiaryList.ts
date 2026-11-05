// src/hooks/useDiaryList.ts
// 2.4 기록 목록 + 주간 리포트 배너를 함께 불러옵니다.

'use client';

import { useEffect, useState } from 'react';

import {
  getDiaryList,
  getWeeklyReportBanner,
  type DiaryListItem,
  type WeeklyReportBanner,
} from '@/lib/api/diary';

export type DiaryListState =
  | { phase: 'loading' }
  | { phase: 'done'; items: DiaryListItem[]; banner: WeeklyReportBanner }
  | { phase: 'error' };

export function useDiaryList() {
  const [state, setState] = useState<DiaryListState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [items, banner] = await Promise.all([
          getDiaryList(),
          // 배너는 실패해도 목록은 보여줌
          getWeeklyReportBanner().catch((): WeeklyReportBanner => ({ available: false })),
        ]);
        if (!cancelled) setState({ phase: 'done', items, banner });
      } catch {
        if (!cancelled) setState({ phase: 'error' });
      }
    })();

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
