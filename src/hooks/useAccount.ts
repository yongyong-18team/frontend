// src/hooks/useAccount.ts
// 6.x 마이페이지·공동 관리자 화면 데이터 불러오기 + 다시 시도

'use client';

import { useLoad } from '@/hooks/useLoad';
import { getSubjectId } from '@/lib/auth/session';
import {
  getMe,
  getMembers,
  getReceivedInvitations,
  getSentInvitations,
  type MeResponse,
} from '@/lib/api/member';

/** 지금 보고 있는 대상자에서 주 보호자인지 (MVP는 대상자 1명) */
export function isOwnerOf(me: MeResponse) {
  const current = me.subjects.find((s) => s.subjectId === getSubjectId()) ?? me.subjects[0];
  return current?.role === 'OWNER';
}

/** 주 보호자 화면용: 관리자 목록 + 대기 중 초대 (INVITE-02는 OWNER만 부를 수 있음) */
async function loadMembersAndPending(owner: boolean) {
  const [members, sent] = await Promise.all([
    getMembers(),
    owner ? getSentInvitations('PENDING') : Promise.resolve({ invitations: [] }),
  ]);
  return { members, pending: sent.invitations };
}

/** 6.1 마이페이지: 내 정보 + 관리자 목록 + (주 보호자면) 대기 중 초대 */
export function useMyPage() {
  return useLoad(async () => {
    const me = await getMe();
    const owner = isOwnerOf(me);
    const rest = me.subjects.length > 0 ? await loadMembersAndPending(owner) : { members: null, pending: [] };
    return { me, owner, ...rest };
  });
}

/** 6.2 초대: 역할만 확인 */
export function useOwnerCheck() {
  return useLoad(async () => isOwnerOf(await getMe()));
}

/** 6.3 관리: 역할 확인 후 관리자 목록 + 대기 중 초대 */
export function useMembersPage() {
  return useLoad(async () => {
    const owner = isOwnerOf(await getMe());
    if (!owner) return { owner, members: null, pending: [] };
    return { owner, ...(await loadMembersAndPending(true)) };
  });
}

/** 6.2.1 받은 초대 */
export function useReceivedInvitations() {
  return useLoad(getReceivedInvitations);
}