// src/hooks/useDiaryAnalysis.ts
// 분석 결과를 완료될 때까지 반복 조회(폴링)합니다.
// - 1.5초마다 조회, 60초가 넘으면 시간 초과
// - 화면을 떠나면 조회 중단

'use client';

import { useEffect, useState } from 'react';

import { getDiaryAnalysis, type DiaryAnalysis } from '@/lib/api/diary';

const POLL_INTERVAL_MS = 1500;
const TIMEOUT_MS = 60_000;

export type AnalysisState =
  | { phase: 'loading' }
  | { phase: 'done'; data: DiaryAnalysis }
  | { phase: 'error'; reason: 'failed' | 'timeout' | 'network' };

export function useDiaryAnalysis(diaryId: string) {
  const [state, setState] = useState<AnalysisState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const data = await getDiaryAnalysis(diaryId);
        if (cancelled) return;
        if (data.status === 'DONE') return setState({ phase: 'done', data });
        if (data.status === 'FAILED') return setState({ phase: 'error', reason: 'failed' });
        if (Date.now() - startedAt > TIMEOUT_MS) {
          return setState({ phase: 'error', reason: 'timeout' });
        }
        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setState({ phase: 'error', reason: 'network' });
      }
    };

    poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [diaryId, attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
