// src/app/diary/daily/[diaryId]/loading.tsx
// 주소를 읽는 동안 잠깐 보이는 화면. B의 공통 로딩(StateView 등)이 있으면 그걸로 바꿔도 됩니다.

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-base">
      <p className="text-body text-text-secondary" role="status">
        정보를 불러오고 있어요.
      </p>
    </main>
  );
}
