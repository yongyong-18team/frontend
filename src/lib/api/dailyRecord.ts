// src/lib/api/dailyRecord.ts
// 공동 관리자(CO)용 2.4 돌봄 기록 (API 명세 2-4 REPORT-01·02, 백엔드 C)
// - 공동 관리자는 일기 원문을 볼 수 없고, 설명서에 "반영(승인)된 항목"만 봅니다.
// - OWNER는 이 API 대신 DIARY-03·04(diary.ts)를 씁니다.
// - .env.local 의 NEXT_PUBLIC_REAL_API 에 report 가 있으면 실제 서버, 없으면 가짜 서버(mock)

import { api, subjectPath } from '@/lib/api/client';
import type { GuideSection, TimeSlot } from '@/lib/api/diary';
import * as mock from '@/lib/api/mock/store';
import { isReal } from '@/lib/api/realApi';

/** 일일 기록 상세 화면 주소 (2.4 목록·1.1 홈 최근 기록에서 이동) */
export const dailyRecordHref = (diaryId: number) => `/diary/daily/${diaryId}`;

/** REPORT-01 목록 한 줄 */
export type DailyRecordSummary = {
  diaryId: number;
  diaryDate: string;
  /** 설명서에 반영된 항목 수 */
  approvedCount: number;
  /** 서버가 만든 한 줄 요약 (원문 아님) */
  summary: string;
};

/** REPORT-01 응답 */
export type DailyRecordList = {
  from: string | null;
  to: string | null;
  records: DailyRecordSummary[];
};

export type DailyRecordItem = {
  content: string;
  timeSlot?: TimeSlot | null;
  durationMin?: number | null;
};

/** REPORT-02 응답: 그날 반영된 항목을 설명서 섹션별로 */
export type DailyRecordDetail = {
  diaryId: number;
  diaryDate: string;
  sections: { section: GuideSection; items: DailyRecordItem[] }[];
};

/** REPORT-01 기간별 일일 기록 목록 (from·to 생략 = 전체) */
export async function getDailyRecords(range: { from?: string; to?: string } = {}): Promise<DailyRecordList> {
  if (isReal('report')) {
    return api.get<DailyRecordList>(subjectPath('/daily-records'), { query: { from: range.from, to: range.to } });
  }

  // ── 가짜 응답 ──
  subjectPath(); // 대상자가 없으면 NO_SUBJECT 오류 (실제와 같게)
  await mock.delay(400);
  return mock.dailyRecords(range.from, range.to);
}

/** REPORT-02 일일 기록 상세 */
export async function getDailyRecord(diaryId: number): Promise<DailyRecordDetail> {
  if (isReal('report')) return api.get<DailyRecordDetail>(subjectPath(`/daily-records/${diaryId}`));

  // ── 가짜 응답 ──
  subjectPath();
  await mock.delay(400);
  return mock.dailyRecord(diaryId);
}
