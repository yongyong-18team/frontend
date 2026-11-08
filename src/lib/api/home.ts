// src/lib/api/home.ts
// 1.1 홈 (API 명세 HOME-01, 백엔드 A)
// 지금은 가짜 서버로 동작합니다. 백엔드 연결 시 "가짜 응답"만 실제 요청으로 바꾸면 됩니다.

import { api, subjectPath } from '@/lib/api/client';
import * as mockAuth from '@/lib/api/mock/auth';
import * as mockStore from '@/lib/api/mock/store';
import type { SubjectRole } from '@/lib/auth/session';
import { getSubjectId } from '@/lib/auth/session';
import { toDateKey } from '@/lib/date';

void api;

export type RecentActivity = {
  diaryId: number;
  diaryDate: string;
  /** 일기 원문 앞부분. 공동 관리자(CO)에게는 null (원문 비공개) */
  preview: string | null;
  approvedCount: number;
  pendingCount: number;
};

export type HomeData = {
  /** OWNER 또는 공동 관리자. TODO(백엔드 A): 공동 관리자 값 이름(CO / CO_MANAGER) 확인 */
  role: SubjectRole | (string & {});
  name: string;
  todayRecorded: boolean;
  recentActivities: RecentActivity[];
  pendingInvitationCount: number;
  /**
   * "함께 쌓아온 돌봄 기록 32일째" 칩 숫자
   * TODO(백엔드 A): Figma에 있지만 HOME-01 응답에 없음. 필드 추가 요청 (없으면 칩을 숨김)
   */
  daysTogether?: number | null;
};

/** HOME-01 */
export async function getHome(): Promise<HomeData> {
  // return api.get<HomeData>(subjectPath('/home'));

  // ── 가짜 응답 ──
  const path = subjectPath('/home'); // 대상자가 없으면 여기서 NO_SUBJECT 오류 (실제와 같게)
  void path;
  await mockStore.delay(400);
  const subject = mockAuth.currentSubject(getSubjectId()!);
  const diaries = mockStore.homeDiarySummary(toDateKey(new Date()));
  const isOwner = subject.role === 'OWNER';
  return {
    role: subject.role,
    name: subject.name,
    todayRecorded: diaries.todayRecorded,
    pendingInvitationCount: subject.pendingInvitationCount,
    daysTogether: diaries.daysTogether,
    recentActivities: diaries.recentActivities.map(({ analyzed, ...a }) => {
      void analyzed;
      return { ...a, preview: isOwner ? a.preview : null };
    }),
  };
}
