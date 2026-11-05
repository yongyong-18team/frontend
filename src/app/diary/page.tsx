// src/app/diary/page.tsx
// 2.4 돌봄 기록 목록 — "돌봄 기록" 탭 첫 화면. 화면은 DiaryList가 그립니다.
// 2.1 일기 작성은 /diary/new 로 옮겼습니다.
// 주소에 params/searchParams를 읽지 않아 loading.tsx는 필요 없습니다.

import DiaryList from '@/components/diary/DiaryList';

export default function Page() {
  return <DiaryList />;
}
