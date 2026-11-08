/* ---------- 타입 (API 명세 v1.4 USER-01, MEMBER-02, INVITE-02) ---------- */
// ⚠ MEMBER-02·INVITE-02의 세부 필드 이름은 명세 예시로 다시 맞출 것

export type Relation = "PARENT" | "OTHER";
export type MemberRole = "OWNER" | "CO";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED" | "REVOKED";

export const RELATION_LABEL: Record<Relation, string> = { PARENT: "부모", OTHER: "기타 보호자" };

/** USER-01 내 정보 */
export type Me = {
  displayName: string;
  relation: Relation;
  loginId: string;
  subjects: { subjectId: number; name: string; role: MemberRole }[];
  pendingInvitationCount: number;
};

/** MEMBER-02 관리자 목록 */
export type Member = { loginId: string; displayName: string };
export type MemberList = { owner: Member; coManagers: Member[] };

/** INVITE-02 보낸 초대 */
export type SentInvitation = {
  invitationId: number;
  inviteeLoginId: string;
  inviteeDisplayName: string;
  status: InvitationStatus;
};

/* ---------- 목업 (Figma 6.1) ---------- */

export const mockMe: Me = {
  displayName: "김영희",
  relation: "PARENT",
  loginId: "test01",
  subjects: [{ subjectId: 10, name: "민지", role: "OWNER" }],
  pendingInvitationCount: 1,
};

export const mockMembers: MemberList = {
  owner: { loginId: "test01", displayName: "김영희" },
  coManagers: [{ loginId: "family002", displayName: "김민수" }],
};

export const mockSentInvitations: SentInvitation[] = [
  { invitationId: 301, inviteeLoginId: "uncle003", inviteeDisplayName: "박삼촌", status: "PENDING" },
  { invitationId: 300, inviteeLoginId: "family002", inviteeDisplayName: "김민수", status: "ACCEPTED" },
];

/* ---------- 6.2 초대 목업 (MEMBER-01 계정 확인, INVITE-01 초대) ---------- */
// 테스트 ID: aunt004 성공 / family002 이미 관리자 / uncle003 이미 초대함 / test01 본인 / 그 밖 = 없는 계정

export type ApiError = { code: string; message: string };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const MOCK_USERS: Record<string, string> = {
  test01: "김영희",
  family002: "김민수",
  uncle003: "박삼촌",
  aunt004: "최이모",
};

/** MEMBER-01 GET /users/lookup?loginId= */
export function mockLookupUser(loginId: string): ApiResult<{ loginId: string; displayName: string }> {
  const displayName = MOCK_USERS[loginId];
  if (!displayName) {
    return { ok: false, error: { code: "USER_NOT_FOUND", message: "존재하지 않는 계정 ID예요. 다시 확인해 주세요." } };
  }
  return { ok: true, data: { loginId, displayName } };
}

/** INVITE-01 POST { inviteeLoginId } */
export function mockSendInvite(inviteeLoginId: string): ApiResult<{ invitationId: number }> {
  if (inviteeLoginId === mockMe.loginId) {
    return { ok: false, error: { code: "INVITE_SELF", message: "본인 계정은 초대할 수 없어요." } };
  }
  if (mockMembers.coManagers.some((m) => m.loginId === inviteeLoginId)) {
    return { ok: false, error: { code: "INVITE_ALREADY_MEMBER", message: "이미 공동 관리자예요." } };
  }
  if (mockSentInvitations.some((i) => i.inviteeLoginId === inviteeLoginId && i.status === "PENDING")) {
    return { ok: false, error: { code: "INVITE_DUPLICATE_PENDING", message: "이미 초대를 보냈어요. 수락을 기다려 주세요." } };
  }
  if (!MOCK_USERS[inviteeLoginId]) {
    return { ok: false, error: { code: "INVITE_USER_NOT_FOUND", message: "존재하지 않는 계정 ID예요. 다시 확인해 주세요." } };
  }
  return { ok: true, data: { invitationId: 302 } };
}

/* ---------- 6.2.1 받은 초대 목업 (INVITE-04 조회, INVITE-05 수락, INVITE-06 거절) ---------- */
// ⚠ createdAt 필드 이름은 명세 예시로 다시 맞출 것
// 테스트: 501 수락·거절 성공 / 502는 보낸 사람이 취소한 초대라 409 INVITE_NOT_PENDING

/** INVITE-04 받은 초대 */
export type ReceivedInvitation = {
  invitationId: number;
  inviterDisplayName: string;
  subjectName: string; // 수락 전엔 이름만
  permissions: string[]; // 고정 문구
  restrictedItems: string[];
  createdAt?: string;
};

export const mockReceivedInvitations: ReceivedInvitation[] = [
  {
    invitationId: 501,
    inviterDisplayName: "박지현",
    subjectName: "민준이",
    permissions: ["돌봄 설명서 열람", "돌봄 설명서 공유", "돌봄 지원"],
    restrictedItems: ["일기 원문", "보호자 감정 기록"],
    createdAt: "2026-11-01T10:00:00+09:00",
  },
  {
    invitationId: 502,
    inviterDisplayName: "이정호",
    subjectName: "서연이",
    permissions: ["돌봄 설명서 열람", "돌봄 설명서 공유", "돌봄 지원"],
    restrictedItems: ["일기 원문", "보호자 감정 기록"],
    createdAt: "2026-11-03T15:20:00+09:00",
  },
];

const NOT_PENDING: ApiError = { code: "INVITE_NOT_PENDING", message: "이미 처리되었거나 취소된 초대예요." };

/** INVITE-05 수락 */
export function mockAcceptInvite(invitationId: number): ApiResult<{ subjectId: number; role: MemberRole }> {
  if (invitationId === 502) return { ok: false, error: NOT_PENDING };
  return { ok: true, data: { subjectId: 11, role: "CO" } };
}

/** INVITE-06 거절 */
export function mockRejectInvite(invitationId: number): ApiResult<null> {
  if (invitationId === 502) return { ok: false, error: NOT_PENDING };
  return { ok: true, data: null };
}

/* ---------- 6.3 공동 관리자 관리 목업 (MEMBER-03 해제) ---------- */
// ⚠ MEMBER-03에 보내는 값(memberId 등)은 명세 예시로 다시 맞출 것. 목업은 loginId

/** MEMBER-03 공동 관리자 해제 → 함께 막힌 공유 링크 수 */
export function mockRemoveMember(loginId: string): ApiResult<{ revokedShareCount: number }> {
  if (loginId === mockMembers.owner.loginId) {
    return { ok: false, error: { code: "MEMBER_CANNOT_REMOVE_OWNER", message: "주 보호자는 해제할 수 없어요." } };
  }
  return { ok: true, data: { revokedShareCount: 2 } };
}