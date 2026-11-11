// src/app/diary/page.tsx
// 2.4 돌봄 기록 탭 — OWNER는 일기 목록, 공동 관리자는 반영된 기록 목록

import DiaryListByRole from '@/components/diary/DiaryListByRole';

export default function Page() {
  return <DiaryListByRole />;
}
