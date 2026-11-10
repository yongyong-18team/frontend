// src/lib/api/realApi.ts
// 어떤 API를 실제 서버로 부를지 고르는 스위치
//   .env.local (내 컴퓨터) 또는 Vercel Environment Variables 에
//     NEXT_PUBLIC_REAL_API=auth,terms,onboarding
//   처럼 쉼표로 적으면 그 API만 실제 서버, 나머지는 가짜 서버(lib/api/mock)로 동작합니다.
//   전부 실제 서버로: NEXT_PUBLIC_REAL_API=all  /  전부 가짜: 비워 두기
// 값을 바꾸면 npm run dev를 껐다 켜야 반영됩니다 (Vercel은 다시 배포).

export type ApiGroup =
  | 'auth' | 'terms' | 'onboarding' | 'home' | 'diary' | 'report' | 'crisis' // 세훈 (crisis = 5.5 SUP-02)
  | 'guide' | 'share' | 'member' | 'resource'; // 윤아 (설명서 / 공유 / 설정 / 돌봄 지원)

const enabled = new Set(
  (process.env.NEXT_PUBLIC_REAL_API ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

export const isReal = (group: ApiGroup) => enabled.has('all') || enabled.has(group);
