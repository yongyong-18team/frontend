// src/lib/api/member.ts
// 계정·공동 관리자 API (API 명세 2-1 USER-01·03, 2-8 MEMBER-01~03·INVITE-01~06, 백엔드 A)
//
// 지금은 src/mocks/account.ts 데이터로 "브라우저 안의 가짜 DB"처럼 동작합니다. (새로고침하면 처음으로)
// 백엔드 연결 시: 각 함수의 "가짜 응답" 부분을 지우고 주석 처리된 실제 요청을 살리면 됩니다.

import { ApiError, api, subjectPath } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/store';
import type { SubjectRole } from '@/lib/auth/session';
import {
  mockMe,
  mockMembers,
  mockReceivedInvitations,
  mockSentInvitations,
  mockUsers,
} from '@/mocks/account';

void api;
void subjectPath;

/* ───────────── 타입 (Swagger 그대로) ───────────── */

export type Relation = 'PARENT' | 'OTHER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'REVOKED';
export type { SubjectRole };

export const RELATION_LABEL: Record<Relation, string> = { PARENT: '부모', OTHER: '기타 보호자' };

/** USER-01 내 정보 */
export type MeResponse = {
  userId: number;
  loginId: string;
  displayName: string;
  relation: Relation;
  subjects: { subjectId: number; name: string; role: SubjectRole }[];
  pendingInvitationCount: number;
};

/** MEMBER-02 (CO가 부르면 loginId는 본인 것만 내려옴) */
export type Owner = { userId: number; displayName: string; relation: Relation; loginId: string | null };
export type CoManager = Owner & { activatedAt: string };
export type MembersResponse = { owner: Owner; coManagers: CoManager[] };

/** INVITE-02 보낸 초대 (⚠ Swagger에 아직 없음, 백엔드 #71 예시 기준) */
export type SentInvitation = {
  invitationId: number;
  inviteeLoginId: string;
  inviteeDisplayName: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt: string | null;
};

/** INVITE-04 받은 초대 */
export type ReceivedInvitation = {
  invitationId: number;
  inviterDisplayName: string;
  /** 수락 전엔 이름만 */
  subjectName: string;
  permissions: string[];
  restrictedItems: string[];
  createdAt: string;
};

/* ───────────── 가짜 DB (백엔드 연결 시 삭제) ───────────── */

let membersDb: MembersResponse = structuredClone(mockMembers);
let sentDb: SentInvitation[] = structuredClone(mockSentInvitations);
let receivedDb: ReceivedInvitation[] = structuredClone(mockReceivedInvitations);
let nextInvitationId = 310;
const nowIso = () => new Date().toISOString();

/* ───────────── API ───────────── */

/** USER-01 내 정보 (대상자별 역할, 받은 초대 수) */
export async function getMe(): Promise<MeResponse> {
  // return api.get<MeResponse>('/users/me');

  // ── 가짜 응답 ──
  await mock.delay(300);
  return { ...structuredClone(mockMe), pendingInvitationCount: receivedDb.length };
}

/** USER-03 탈퇴 */
export async function withdraw(): Promise<void> {
  // return api.delete<void>('/users/me');

  // ── 가짜 응답 ──
  await mock.delay(500);
}

/** MEMBER-02 공동 관리자 목록 */
export async function getMembers(): Promise<MembersResponse> {
  // return api.get<MembersResponse>(subjectPath('/members'));

  // ── 가짜 응답 ──
  await mock.delay(400);
  return structuredClone(membersDb);
}

/** MEMBER-03 공동 관리자 삭제 + 그 사람이 만든 활성 링크 철회 */
export async function removeMember(userId: number): Promise<{ revokedShareCount: number }> {
  // return api.delete<{ revokedShareCount: number }>(subjectPath(`/members/${userId}`));

  // ── 가짜 응답 ──
  await mock.delay(500);
  if (userId === membersDb.owner.userId) {
    throw new ApiError(400, 'MEMBER_CANNOT_REMOVE_OWNER', '주 보호자는 삭제할 수 없어요.');
  }
  if (!membersDb.coManagers.some((m) => m.userId === userId)) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', '공동 관리자를 찾을 수 없어요.');
  }
  membersDb = { ...membersDb, coManagers: membersDb.coManagers.filter((m) => m.userId !== userId) };
  return { revokedShareCount: 2 };
}

/** MEMBER-01 계정 존재 확인 (표시명만, 분당 10회) */
export async function lookupUser(loginId: string): Promise<{ userId: number; displayName: string }> {
  // return api.get<{ userId: number; displayName: string }>('/users/lookup', { query: { loginId } });

  // ── 가짜 응답 ──
  await mock.delay(400);
  const user = mockUsers[loginId];
  if (!user) throw new ApiError(404, 'INVITE_USER_NOT_FOUND', '해당 아이디의 사용자가 없어요.');
  return user;
}

/** INVITE-01 초대 발송 (권한 값은 보내지 않음) */
export async function sendInvite(inviteeLoginId: string): Promise<{ invitationId: number; status: InvitationStatus }> {
  // return api.post<{ invitationId: number; status: InvitationStatus }>(subjectPath('/invitations'), { inviteeLoginId });

  // ── 가짜 응답 ──
  await mock.delay(500);
  const user = mockUsers[inviteeLoginId];
  if (!user) throw new ApiError(404, 'INVITE_USER_NOT_FOUND', '해당 아이디의 사용자가 없어요.');
  if (inviteeLoginId === mockMe.loginId) throw new ApiError(400, 'INVITE_SELF', '본인은 초대할 수 없어요.');
  if (membersDb.coManagers.some((m) => m.loginId === inviteeLoginId)) {
    throw new ApiError(409, 'INVITE_ALREADY_MEMBER', '이미 공동 관리자예요.');
  }
  if (sentDb.some((i) => i.inviteeLoginId === inviteeLoginId && i.status === 'PENDING')) {
    throw new ApiError(409, 'INVITE_DUPLICATE_PENDING', '이미 초대를 보냈어요. 수락을 기다려 주세요.');
  }
  const invitation: SentInvitation = {
    invitationId: nextInvitationId++,
    inviteeLoginId,
    inviteeDisplayName: user.displayName,
    status: 'PENDING',
    createdAt: nowIso(),
    respondedAt: null,
  };
  sentDb = [invitation, ...sentDb];
  return { invitationId: invitation.invitationId, status: 'PENDING' };
}

/** INVITE-02 보낸 초대 목록 (status 생략하면 전체, 최신순) ⚠ 백엔드 #71 머지 후 Swagger 확인 */
export async function getSentInvitations(status?: InvitationStatus): Promise<{ invitations: SentInvitation[] }> {
  // return api.get<{ invitations: SentInvitation[] }>(subjectPath('/invitations'), { query: { status } });

  // ── 가짜 응답 ──
  await mock.delay(400);
  return { invitations: structuredClone(status ? sentDb.filter((i) => i.status === status) : sentDb) };
}

/** INVITE-03 대기 중 초대 취소 */
export async function cancelInvitation(invitationId: number): Promise<void> {
  // return api.post<void>(subjectPath(`/invitations/${invitationId}/cancel`));

  // ── 가짜 응답 ──
  await mock.delay(400);
  const inv = sentDb.find((i) => i.invitationId === invitationId);
  if (!inv || inv.status !== 'PENDING') {
    throw new ApiError(409, 'INVITE_NOT_PENDING', '이미 처리되었거나 취소된 초대예요.');
  }
  inv.status = 'CANCELED';
  inv.respondedAt = nowIso();
}

/** INVITE-04 받은 초대 목록 */
export async function getReceivedInvitations(): Promise<{ invitations: ReceivedInvitation[] }> {
  // return api.get<{ invitations: ReceivedInvitation[] }>('/users/me/invitations');

  // ── 가짜 응답 ──
  await mock.delay(400);
  return { invitations: structuredClone(receivedDb) };
}

const NOT_PENDING = () => new ApiError(409, 'INVITE_NOT_PENDING', '이미 처리되었거나 취소된 초대예요.');

/** INVITE-05 수락 → { subjectId, role } (화면에서 setSubjectId로 현재 대상자 저장) */
export async function acceptInvitation(invitationId: number): Promise<{ subjectId: number; role: SubjectRole }> {
  // return api.post<{ subjectId: number; role: SubjectRole }>(`/users/me/invitations/${invitationId}/accept`);

  // ── 가짜 응답 ──
  await mock.delay(500);
  receivedDb = receivedDb.filter((i) => i.invitationId !== invitationId);
  if (invitationId === 502) throw NOT_PENDING();
  return { subjectId: 10, role: 'CO_MANAGER' };
}

/** INVITE-06 거절 */
export async function rejectInvitation(invitationId: number): Promise<void> {
  // return api.post<void>(`/users/me/invitations/${invitationId}/reject`);

  // ── 가짜 응답 ──
  await mock.delay(400);
  receivedDb = receivedDb.filter((i) => i.invitationId !== invitationId);
  if (invitationId === 502) throw NOT_PENDING();
}