// src/hooks/useWeeklyReport.ts
// 2.5 주간 리포트 조회. 주소에 기간이 없거나 잘못됐으면 이번 주(월요일 시작)로 보여줍니다.

'use client';

import { useEffect, useState } from 'react';

import { getWeeklyReport, type WeeklyReport } from '@/lib/api/report';
import { isDateKey, startOfWeek, toDateKey } from '@/lib/date';

export type WeeklyReportState =
  | { phase: 'loading' }
  | { phase: 'done'; report: WeeklyReport }
  | { phase: 'error' };

export function useWeeklyReport(periodStartParam?: string) {
  const [state, setState] = useState<WeeklyReportState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // 오늘 날짜는 브라우저에서만 계산
    const periodStart = isDateKey(periodStartParam)
      ? periodStartParam
      : toDateKey(startOfWeek(new Date()));

    (async () => {
      try {
        const report = await getWeeklyReport(periodStart);
        if (!cancelled) setState({ phase: 'done', report });
      } catch {
        if (!cancelled) setState({ phase: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [periodStartParam, attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
