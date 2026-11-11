// src/hooks/useSubjectRole.ts
// 지금 보고 있는 대상자에 대한 내 역할 (OWNER / 공동 관리자)
// - 로그인·온보딩 때 저장해 둔 역할을 먼저 씀
// - 저장된 게 없으면(예전에 로그인했거나 초대 수락으로 대상자가 바뀐 경우) HOME-01의 role로 알아내서 저장
// - 대상자가 아직 없으면(온보딩 전) OWNER로 봄 → 각 화면이 원래대로 온보딩 안내

'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { ApiError, CLIENT_ERROR } from '@/lib/api/client';
import { getHome } from '@/lib/api/home';
import { getSubjectId, getSubjectRole, setSubjectRole, subscribeSession } from '@/lib/auth/session';

export type RoleState = { phase: 'loading' } | { phase: 'done'; isOwner: boolean } | { phase: 'error'; error: unknown };

export function useSubjectRole(): { state: RoleState; retry: () => void } {
  // 서버 렌더링 중에는 localStorage를 못 읽으므로 undefined → 로딩
  const saved = useSyncExternalStore(subscribeSession, getSubjectRole, () => undefined);
  const [fetchError, setFetchError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [noSubject, setNoSubject] = useState(false);

  useEffect(() => {
    if (saved !== null) return; // 이미 알거나(문자열) 아직 서버 렌더링(undefined)
    if (getSubjectId() === null) {
      setNoSubject(true);
      return;
    }
    let cancelled = false;
    getHome()
      .then((home) => {
        const subjectId = getSubjectId();
        if (!cancelled && subjectId !== null) setSubjectRole(subjectId, home.role); // 저장 → saved가 바뀌며 다시 그림
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === CLIENT_ERROR.NO_SUBJECT) setNoSubject(true);
        else setFetchError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [saved, attempt]);

  const retry = () => {
    setFetchError(null);
    setAttempt((n) => n + 1);
  };

  let state: RoleState;
  if (typeof saved === 'string') state = { phase: 'done', isOwner: saved === 'OWNER' };
  else if (noSubject) state = { phase: 'done', isOwner: true };
  else if (fetchError) state = { phase: 'error', error: fetchError };
  else state = { phase: 'loading' };

  return { state, retry };
}
