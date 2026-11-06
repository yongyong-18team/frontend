// src/app/diary/[diaryId]/result/page.tsx
// 2.2 AI 분석 결과 — 주소의 diaryId만 읽고, 화면은 DiaryResult가 그립니다.
// params를 읽으므로 같은 폴더의 loading.tsx가 필요합니다 (Cache Components).

import DiaryResult from '@/components/diary/DiaryResult';

export default async function Page({ params }: { params: Promise<{ diaryId: string }> }) {
  const { diaryId } = await params;
  return <DiaryResult diaryId={diaryId} />;
}
