// src/app/diary/[diaryId]/review/page.tsx
// 2.3 분석 정보 승인 — 주소의 diaryId(숫자)만 읽고, 화면은 DiaryReview가 그립니다.
// params를 읽으므로 같은 폴더의 loading.tsx가 필요합니다 (Cache Components).

import { notFound } from 'next/navigation';

import DiaryReview from '@/components/diary/DiaryReview';

export default async function Page({ params }: { params: Promise<{ diaryId: string }> }) {
  const { diaryId } = await params;
  const id = Number(diaryId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <DiaryReview diaryId={id} />;
}
