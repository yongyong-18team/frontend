// src/hooks/useDiaryAnalysis.ts
// 2.2 AI 분석 결과 불러오기
//
// 1) DIARY-04로 일기를 확인 → 이미 분석이 끝났으면(DONE) 그 결과를 보여줌
// 2) 아직이면 DIARY-02 분석을 "한 번" 요청하고 응답을 기다림 (서버 최대 25초, 클라이언트 35초)
//    - DIARY_ALREADY_ANALYZING(409): 다른 요청이 분석 중 → 3초 뒤 상세를 다시 확인
//    - AI_TIMEOUT(502): 일기는 저장돼 있으니 "다시 시도"로 분석을 다시 요청
// 같은 일기를 동시에 두 번 분석 요청하지 않도록 진행 중인 요청을 공유합니다.
// (개발 모드에서는 React가 화면을 두 번 그려 보기 때문에 필요)

'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/lib/api/client';
import { analyzeDiary, getDiaryDetail, type AnalyzeResult, type AnalyzeResultType, type DiaryItem } from '@/lib/api/diary';

export type DiaryAnalysisView = {
  result: AnalyzeResultType;
  empathyText: string | null;
  items: DiaryItem[];
  /** DIARY-02 응답에만 있음. 이미 분석된 일기를 다시 열면 false */
  burnoutNotice: boolean;
};

export type AnalysisState =
  | { phase: 'loading' }
  | { phase: 'done'; data: DiaryAnalysisView }
  | { phase: 'error'; error: unknown };

const RETRY_WAIT_MS = 3000;
const MAX_WAIT_ROUNDS = 12;

const inflight = new Map<number, Promise<AnalyzeResult>>();

function analyzeOnce(diaryId: number) {
  let request = inflight.get(diaryId);
  if (!request) {
    request = analyzeDiary(diaryId).finally(() => inflight.delete(diaryId));
    inflight.set(diaryId, request);
  }
  return request;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadAnalysis(diaryId: number, isCancelled: () => boolean): Promise<DiaryAnalysisView> {
  for (let round = 0; round < MAX_WAIT_ROUNDS; round += 1) {
    const detail = await getDiaryDetail(diaryId);
    if (detail.analysisStatus === 'DONE') {
      // 위기 여부는 상세에 없음 → 다시 열면 추출 결과 기준으로만 보여줌
      return {
        result: detail.items.length > 0 ? 'REVIEW' : 'NO_ITEMS',
        empathyText: detail.empathyText,
        items: detail.items,
        burnoutNotice: false,
      };
    }
    if (isCancelled()) throw new Error('cancelled');

    try {
      const res = await analyzeOnce(diaryId);
      return { result: res.result, empathyText: res.empathyText, items: res.items, burnoutNotice: res.burnoutNotice };
    } catch (e) {
      if (e instanceof ApiError && e.code === 'DIARY_ALREADY_ANALYZING') {
        await sleep(RETRY_WAIT_MS);
        continue;
      }
      throw e;
    }
  }
  throw new ApiError(0, 'CLIENT_TIMEOUT', '분석이 늦어지고 있어요. 기록은 저장됐으니 다시 시도해 주세요.');
}

export function useDiaryAnalysis(diaryId: number) {
  const [state, setState] = useState<AnalysisState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadAnalysis(diaryId, () => cancelled)
      .then((data) => !cancelled && setState({ phase: 'done', data }))
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
