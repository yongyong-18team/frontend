// src/lib/api/report.ts
// 주간 리포트 API (백엔드 B)
// 지금은 "브라우저 안의 가짜 DB"(mock 폴더)에 저장된 일기로 리포트를 계산합니다.
// 백엔드 연결 시 "가짜 응답" 부분만 실제 요청으로 바꾸면 됩니다.

// import { api } from '@/lib/api/client';
import { mockStore } from '@/lib/api/mock/store';
import { addDays, fromDateKey, toDateKey } from '@/lib/date';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type DailyCount = {
  /** YYYY-MM-DD */
  date: string;
  /** 그날 기록된 도전 행동 수 */
  count: number;
};

export type ReportInsight = {
  id: string;
  /** 예: 안정에 도움 된 방법 */
  title: string;
  /** 예: 익숙한 동요 듣기 · 3회 효과 */
  summary: string;
};

export type WeeklyReport = {
  /** 월요일 YYYY-MM-DD */
  periodStart: string;
  /** 일요일 YYYY-MM-DD */
  periodEnd: string;
  /** 이 주에 기록한 날 수 */
  recordedDays: number;
  /** 요약 카드 아래 한 줄 (예: 큰 소리에 대한 반응이 3회 관찰됐어요) */
  highlight: string;
  /** 월~일 7개 */
  daily: DailyCount[];
  insights: ReportInsight[];
};

/**
 * 주간 리포트 조회
 * TODO(백엔드 B): 주소, 주 시작 요일(월요일 기준이 맞는지), "도전 행동"을 어떻게 세는지, 응답 형식
 */
export async function getWeeklyReport(periodStart: string): Promise<WeeklyReport> {
  // return api.get<WeeklyReport>('/reports/weekly', { query: { periodStart } });

  // ── 가짜 응답: 저장된 일기로 계산 ──
  await delay(600);
  const start = fromDateKey(periodStart);
  const days = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
  const periodEnd = days[6];

  // 이 주의 일기 (분석 실패·위기 제외)
  const diaries = mockStore
    .all()
    .filter((d) => d.date >= periodStart && d.date <= periodEnd && !d.failed && d.riskLevel !== 'CRISIS');

  // 제외(EXCLUDED)한 항목은 리포트에서 뺌
  const items = diaries.flatMap((d) =>
    d.items.filter((i) => i.reviewStatus !== 'EXCLUDED').map((i) => ({ ...i, date: d.date })),
  );

  // 도전 행동 = "행동 특성" 항목 수
  const behaviors = items.filter((i) => i.category === 'BEHAVIOR');
  const copings = items.filter((i) => i.category === 'COPING');

  const daily = days.map((date) => ({ date, count: behaviors.filter((b) => b.date === date).length }));
  const recordedDays = new Set(diaries.map((d) => d.date)).size;

  const highlight =
    recordedDays === 0
      ? ''
      : behaviors.length > 0
        ? `도전 행동이 ${behaviors.length}회 관찰됐어요`
        : '이번 기간에는 도전 행동이 기록되지 않았어요';

  const insights: ReportInsight[] = [];
  if (copings.length > 0) {
    const top = mostFrequent(copings.map((c) => c.summary));
    insights.push({ id: 'calm', title: '안정에 도움 된 방법', summary: `${top.value} · ${copings.length}회 기록` });
  }
  if (behaviors.length > 0) {
    const top = mostFrequent(behaviors.map((b) => b.summary));
    const topDay = daily.reduce((a, b) => (b.count > a.count ? b : a));
    insights.push({
      id: 'pattern',
      title: '관찰된 행동 패턴',
      summary: `${top.value} · ${weekdayName(topDay.date)}요일에 가장 많음`,
    });
  }

  return { periodStart, periodEnd, recordedDays, highlight, daily, insights };
}

function mostFrequent(values: string[]) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = { value: values[0], count: 0 };
  for (const [value, count] of counts) if (count > best.count) best = { value, count };
  return best;
}

function weekdayName(dateKey: string) {
  return ['일', '월', '화', '수', '목', '금', '토'][fromDateKey(dateKey).getDay()];
}
