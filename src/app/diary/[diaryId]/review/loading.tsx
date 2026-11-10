// src/app/diary/[diaryId]/review/loading.tsx
// 주소를 읽는 동안 잠깐 보이는 화면

import { LoadingState } from '@/components/common/StateView';

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] bg-bg-base px-6 pt-[186px]">
      <LoadingState count={2} label="정보를 불러오고 있어요." />
    </main>
  );
}
