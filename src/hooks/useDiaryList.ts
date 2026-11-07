// src/hooks/useDiaryList.ts
// 2.4 기록 목록 (DIARY-03) + 주간 리포트 배너 (REPORT-03)
// - 기간 필터는 서버에서 처리 (from/to). 필터를 바꾸면 처음부터 다시 불러옴
// - 20개씩 나눠 불러오고 "더 보기"로 다음 페이지
// - "기록 없음" 화면은 전체 기록이 0건일 때만 (기간 필터 결과가 0건인 것과 구분)

'use client';

import { useCallback, useEffect, useState } from 'react';

import { getDiaryList, type DiaryListItem } from '@/lib/api/diary';
import { getWeeklyReport } from '@/lib/api/report';
import { lastMonthRange, thisWeekRange } from '@/lib/date';

export type DiaryFilter = 'ALL' | 'THIS_WEEK' | 'LAST_MONTH';

const PAGE_SIZE = 20;

function rangeOf(filter: DiaryFilter) {
  const today = new Date();
  if (filter === 'THIS_WEEK') return thisWeekRange(today);
  if (filter === 'LAST_MONTH') return lastMonthRange(today);
  return {};
}

export type DiaryListState =
  | { phase: 'loading' }
  | { phase: 'done'; items: DiaryListItem[]; total: number; page: number; loadingMore: boolean; moreError: boolean }
  | { phase: 'error'; error: unknown };

export function useDiaryList(filter: DiaryFilter) {
  const [state, setState] = useState<DiaryListState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  /** 전체 기록이 있는지 (전체 필터로 불러왔을 때 알게 됨). 모르면 null */
  const [hasAnyRecords, setHasAnyRecords] = useState<boolean | null>(null);
  /** 주간 리포트 배너 (REPORT-03은 P1이라 실패해도 목록은 보여줌) */
  const [showReportBanner, setShowReportBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    getDiaryList({ ...rangeOf(filter), page: 0, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setState({ phase: 'done', items: res.content, total: res.totalElements, page: 0, loadingMore: false, moreError: false });
        if (filter === 'ALL') setHasAnyRecords(res.totalElements > 0);
        else if (res.totalElements > 0) setHasAnyRecords(true);
      })
      .catch((error) => !cancelled && setState({ phase: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [filter, attempt]);

  useEffect(() => {
    let cancelled = false;
    getWeeklyReport()
      .then((report) => !cancelled && setShowReportBanner(report.recordCount > 0))
      .catch(() => !cancelled && setShowReportBanner(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loadMore = useCallback(async () => {
    if (state.phase !== 'done' || state.loadingMore || state.items.length >= state.total) return;
    const nextPage = state.page + 1;
    setState({ ...state, loadingMore: true, moreError: false });
    try {
      const res = await getDiaryList({ ...rangeOf(filter), page: nextPage, size: PAGE_SIZE });
      setState((prev) =>
        prev.phase === 'done'
          ? { ...prev, items: [...prev.items, ...res.content], total: res.totalElements, page: nextPage, loadingMore: false }
          : prev,
      );
    } catch {
      setState((prev) => (prev.phase === 'done' ? { ...prev, loadingMore: false, moreError: true } : prev));
    }
  }, [state, filter]);

  const retry = () => setAttempt((n) => n + 1);

  return { state, hasAnyRecords, showReportBanner, loadMore, retry };
}
