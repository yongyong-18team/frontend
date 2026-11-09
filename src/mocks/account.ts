// src/mocks/account.ts
// 6.x 목업 데이터 (모양은 Swagger·API 명세 v1.4.1 그대로). 동작은 lib/api/member.ts의 가짜 응답에서.
// 테스트 ID (6.2): aunt004 성공 / family002 이미 관리자 / uncle003 이미 초대함 / test01 본인 / 그 밖 = 없는 계정
// 테스트 (6.2.1): 501 수락·거절 성공 / 502는 보낸 사람이 취소한 초대라 409 INVITE_NOT_PENDING

import type { MeResponse, MembersResponse, ReceivedInvitation, SentInvitation } from '@/lib/api/member';

export const mockMe: MeResponse = {
  userId: 1,
  loginId: 'test01',
  displayName: '김영희',
  relation: 'PARENT',
  subjects: [{ subjectId: 10, name: '민지', role: 'OWNER' }],
  pendingInvitationCount: 2,
};

export const mockMembers: MembersResponse = {
  owner: { userId: 1, displayName: '김영희', relation: 'PARENT', loginId: 'test01' },
  coManagers: [
    { userId: 2, displayName: '김민수', relation: 'OTHER', loginId: 'family002', activatedAt: '2026-11-04T10:00:00+09:00' },
  ],
};

export const mockSentInvitations: SentInvitation[] = [
  {
    invitationId: 301,
    inviteeLoginId: 'uncle003',
    inviteeDisplayName: '박삼촌',
    status: 'PENDING',
    createdAt: '2026-11-06T09:00:00+09:00',
    respondedAt: null,
  },
  {
    invitationId: 300,
    inviteeLoginId: 'family002',
    inviteeDisplayName: '김민수',
    status: 'ACCEPTED',
    createdAt: '2026-11-04T09:00:00+09:00',
    respondedAt: '2026-11-04T10:00:00+09:00',
  },
];

/** MEMBER-01 계정 확인용 (아이디 → userId·이름) */
export const mockUsers: Record<string, { userId: number; displayName: string }> = {
  test01: { userId: 1, displayName: '김영희' },
  family002: { userId: 2, displayName: '김민수' },
  uncle003: { userId: 3, displayName: '박삼촌' },
  aunt004: { userId: 4, displayName: '최이모' },
};

export const mockReceivedInvitations: ReceivedInvitation[] = [
  {
    invitationId: 501,
    inviterDisplayName: '박지현',
    subjectName: '민준이',
    permissions: ['돌봄 설명서 열람', '돌봄 정보 공유', '돌봄 지원 이용'],
    restrictedItems: ['일기 원문', '설명서 수정', '보호자 상태 정보'],
    createdAt: '2026-11-01T10:00:00+09:00',
  },
  {
    invitationId: 502,
    inviterDisplayName: '이정호',
    subjectName: '서연이',
    permissions: ['돌봄 설명서 열람', '돌봄 정보 공유', '돌봄 지원 이용'],
    restrictedItems: ['일기 원문', '설명서 수정', '보호자 상태 정보'],
    createdAt: '2026-11-03T15:20:00+09:00',
  },
];