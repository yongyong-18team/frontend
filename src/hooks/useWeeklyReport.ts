// src/hooks/useWeeklyReport.ts
// 2.5 주간 리포트 (REPORT-03): endDate 포함 최근 7일. 주소에 날짜가 없거나 잘못됐으면 오늘 기준

'use client';

import { useEffect, useState } from 'react';

import { getWeeklyReport, type WeeklyReport } from '@/lib/api/report';
import { isDateKey } from '@/lib/date';

export type WeeklyReportState =
  | { phase: 'loading' }
  | { phase: 'done'; report: WeeklyReport }
  | { phase: 'error'; error: unknown };

export function useWeeklyReport(endDateParam?: string) {
  const [state, setState] = useState<WeeklyReportState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getWeeklyReport(isDateKey(endDateParam) ? endDateParam : undefined)
      .then((report) => !cancelled && setState({ phase: 'done', report }))
      .catch((error) => !cancelled && setState({ phase: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [endDateParam, attempt]);

  const retry = () => {
    setState({ phase: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
