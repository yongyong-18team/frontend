// src/app/report/page.tsx
// 2.5 주간 돌봄 리포트 — 주소의 periodStart(YYYY-MM-DD)만 읽고, 화면은 WeeklyReport가 그립니다.
// 예) /report?periodStart=2026-10-26  (없으면 이번 주)
// searchParams를 읽으므로 같은 폴더의 loading.tsx가 필요합니다 (Cache Components).

import WeeklyReport from '@/components/report/WeeklyReport';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ periodStart?: string | string[] }>;
}) {
  const { periodStart } = await searchParams;
  return <WeeklyReport periodStart={typeof periodStart === 'string' ? periodStart : undefined} />;
}
