export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-6">

        <h1 className="text-2xl font-bold text-foreground">
          돌봄 서비스
        </h1>

        <p className="mt-2 text-sm text-muted">
          디자인 토큰 적용 테스트 화면입니다.
        </p>

        <button className="mt-6 w-full rounded-control bg-primary px-4 py-3 font-semibold text-white">
          시작하기
        </button>

        <button className="mt-3 w-full rounded-control bg-secondary px-4 py-3 font-semibold text-white">
          자세히 알아보기
        </button>

      </div>
    </main>
  );
}