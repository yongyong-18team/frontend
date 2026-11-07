// src/app/report/page.tsx
// 2.5 주간 돌봄 리포트 — 주소의 endDate(YYYY-MM-DD)만 읽고, 화면은 WeeklyReport가 그립니다.
// 예) /report?endDate=2026-11-03  → 10월 28일 ~ 11월 3일 (없으면 오늘까지 최근 7일)
// searchParams를 읽으므로 같은 폴더의 loading.tsx가 필요합니다 (Cache Components).

import WeeklyReport from '@/components/report/WeeklyReport';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ endDate?: string | string[] }>;
}) {
  const { endDate } = await searchParams;
  return <WeeklyReport endDate={typeof endDate === 'string' ? endDate : undefined} />;
}
