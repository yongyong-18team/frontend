// src/hooks/useSupport.ts
// 5.x 돌봄 지원 화면 데이터 불러오기

'use client';

import { useEffect, useState } from 'react';

import { useLoad, type LoadState } from '@/hooks/useLoad';
import { getSubject } from '@/lib/api/guide';
import {
  getBurnoutGuide,
  getResourceDetail,
  searchResources,
  type ResourceSearchQuery,
  type ResourceSearchResponse,
} from '@/lib/api/resource';

/**
 * RES-02: 조건(query)이 바뀔 때마다 다시 검색. query가 null이면 검색 안 함(idle)
 * 조건별로 결과를 기억해서, 조건이 바뀌면 바로 "불러오는 중"으로 보임
 */
export function useResourceSearch(query: ResourceSearchQuery | null) {
  const [attempt, setAttempt] = useState(0);
  const key = query ? `${JSON.stringify(query)}#${attempt}` : null;
  const [result, setResult] = useState<{ key: string; state: LoadState<ResourceSearchResponse> } | null>(null);

  useEffect(() => {
    if (!key || !query) return;
    let cancelled = false;
    searchResources(query)
      .then((data) => !cancelled && setResult({ key, state: { phase: 'done', data } }))
      .catch((error) => !cancelled && setResult({ key, state: { phase: 'error', error } }));
    return () => {
      cancelled = true;
    };
    // key에 query가 들어 있어서 key만 봄
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const state: LoadState<ResourceSearchResponse> | { phase: 'idle' } =
    key === null ? { phase: 'idle' } : result && result.key === key ? result.state : { phase: 'loading' };

  return { state, retry: () => setAttempt((n) => n + 1) };
}

/** 5.1: 등록 지역을 알려고 대상자 정보(SUBJ-02) */
export function useSubjectForSupport() {
  return useLoad(getSubject);
}

/** 5.3 상세 (번호는 화면에서 바뀌지 않음) */
export function useResourceDetail(resourceId: number) {
  return useLoad(() => getResourceDetail(resourceId));
}

/** 5.4 휴식 안내 */
export function useBurnoutGuide() {
  return useLoad(getBurnoutGuide);
}