import { useMemo, useSyncExternalStore } from "react";
import type { ShareApproveResponse, ShareDraftRequest, ShareDraftResponse } from "@/mocks/share";

/**
 * 4.1 → 4.2 → 4.3 사이에 값을 넘기는 임시 저장소 (이 탭에서만, 새로고침해도 유지)
 * - shareDraft: 4.1에서 고른 값 + 4.2 미리보기. 4.2 "이전"으로 돌아가면 4.1이 복원
 * - issuedShare: 4.3 발급 결과(shareUrl). 4.3을 떠나면 지움 (링크는 이때만 복사 가능)
 */
export type ShareDraftState = {
  request: ShareDraftRequest;
  response: ShareDraftResponse;
};

export type IssuedShareState = {
  approve: ShareApproveResponse;
  recipientLabel: string | null;
};

const DRAFT_KEY = "dolbom.shareDraft";
const ISSUED_KEY = "dolbom.issuedShare";

function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장이 막힌 브라우저면 복원만 안 될 뿐 흐름은 계속됨
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // 무시
  }
}

const subscribe = () => () => {};

/** 서버 렌더링·첫 화면: undefined(아직 모름) / 없음: null / 있음: 값 */
function useStored<T>(key: string): T | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [raw]);
}

export const saveShareDraft = (state: ShareDraftState) => save(DRAFT_KEY, state);
export const clearShareDraft = () => remove(DRAFT_KEY);
export const useShareDraft = () => useStored<ShareDraftState>(DRAFT_KEY);

export const saveIssuedShare = (state: IssuedShareState) => save(ISSUED_KEY, state);
export const clearIssuedShare = () => remove(ISSUED_KEY);
export const useIssuedShare = () => useStored<IssuedShareState>(ISSUED_KEY);