// src/hooks/useShare.ts
// 4.3 공유 내역 (SHARE-04), 4.4 수신자 (PUB-01) 불러오기 + 다시 시도

'use client';

import { useLoad } from '@/hooks/useLoad';
import { getPublicShare, getShareHistory } from '@/lib/api/share';

/** 4.3 공유 내역 */
export function useShareHistory() {
  return useLoad(getShareHistory);
}

/** 4.4 수신자 페이지 (토큰은 화면에서 바뀌지 않음) */
export function usePublicShare(token: string) {
  return useLoad(() => getPublicShare(token));
}