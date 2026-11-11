// src/app/diary/daily/[diaryId]/page.tsx
// 2.4 일일 기록 상세 (공동 관리자, REPORT-02) — 주소의 diaryId(숫자)만 읽고, 화면은 DailyRecordDetail이 그립니다.
// params를 읽으므로 같은 폴더의 loading.tsx가 필요합니다 (Cache Components).

import { notFound } from 'next/navigation';

import DailyRecordDetail from '@/components/diary/DailyRecordDetail';

export default async function Page({ params }: { params: Promise<{ diaryId: string }> }) {
  const { diaryId } = await params;
  const id = Number(diaryId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <DailyRecordDetail diaryId={id} />;
}
