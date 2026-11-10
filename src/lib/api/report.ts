// src/lib/api/report.ts
// 리포트 API (API 명세 2-5, 백엔드 C)
// REPORT-03 주간 리포트는 명세상 P1(MVP 이후)입니다.
// 지금은 가짜 DB(mock 폴더)의 일기로 계산합니다. 백엔드 연결 시 "가짜 응답"만 실제 요청으로 바꾸면 됩니다.

import { api, subjectPath } from '@/lib/api/client';
import type { GuideSection, TimeSlot } from '@/lib/api/diary';
import * as mock from '@/lib/api/mock/store';

void api;
void subjectPath;

export type DailyTrend = { date: string; recordCount: number; behaviorCount: number };
export type KeyChange = { diaryId: number; diaryDate: string; section: GuideSection; content: string };

/** REPORT-03 응답 */
export type WeeklyReport = {
  /** endDate 포함 최근 7일의 첫날 */
  periodStart: string;
  periodEnd: string;
  /** 일기 수 */
  recordCount: number;
  /** 승인된 BEHAVIOR 항목 수 */
  behaviorCount: number;
  /** 요약 문장. 기록 3건 미만이면 빈 배열 */
  summaryLines: string[];
  /** 7일 모두 (그래프용) */
  dailyTrend: DailyTrend[];
  /** 이 기간에 설명서에 새로 반영된 항목. 누르면 그 일기 상세로 */
  keyChanges: KeyChange[];
  repeatedBehaviors: { label: string; count: number }[];
  timePattern: { timeSlot: TimeSlot; count: number }[];
  /**
   * "안정에 도움 된 방법" (기획 문구 확정안 v1.4 2.5) — 이 기간에 승인된 대처 방법(COPING), 많이 나온 순
   * TODO(백엔드 C): REPORT-03 명세에 없는 필드. 추가 요청 중 (서버가 안 보내면 화면에서 섹션을 숨김)
   */
  copingMethods?: { content: string; count: number }[];
};

/** REPORT-03 주간 리포트: endDate 포함 최근 7일 (생략하면 오늘) */
export async function getWeeklyReport(endDate?: string): Promise<WeeklyReport> {
  // return api.get<WeeklyReport>(subjectPath('/weekly-reports'), { query: { endDate } });

  // ── 가짜 응답 ──
  await mock.delay(600);
  return mock.weeklyReport(endDate);
}
