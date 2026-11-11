// playwright.config.ts
// E2E 자동 테스트 설정 (A 담당 화면: 0.1 로그인·가입, 0.2 온보딩, 1.1 홈, 2.x 기록, 5.5 위기 안내, 공동 관리자 2.4, PWA)
//
// 실행:  npm run test:e2e          (처음 한 번은 npx playwright install chromium)
//        npm run test:e2e:ui       (화면을 보면서 한 단계씩)
//
// - 테스트용 개발 서버를 3100번 포트로 따로 띄웁니다 (내가 켜 둔 npm run dev(3000)와 안 겹침)
// - 모든 API를 가짜 서버(mock)로 돌립니다: .env.local 에 실제 서버를 켜 둬도 테스트는 영향 없음
//   → 백엔드 상태와 상관없이 언제 돌려도 같은 결과
// - 테스트마다 브라우저 저장소가 비어 있어서(새 시크릿 창과 같음) 가짜 DB도 매번 처음 상태

import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  // 개발 서버는 화면을 처음 열 때 컴파일하느라 느려서 넉넉하게
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // 같은 개발 서버를 쓰므로 하나씩 차례로
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      // 앱이 모바일 화면(390px) 기준이라 폰 크기로
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: false },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // 개발 서버의 instant-navigation 경고 등은 테스트 결과와 상관없어서 숨김
    // (서버가 아예 안 뜨면 npm run dev 로 직접 켜서 오류를 확인)
    stdout: 'ignore',
    stderr: 'ignore',
    env: {
      // 전부 가짜 서버 (빈 값은 윈도우에서 무시될 수 있어 아무 API 이름도 아닌 값으로)
      NEXT_PUBLIC_REAL_API: 'none',
      NEXT_PUBLIC_AUTH_GUARD: 'on', // 로그인 검사 켜기
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
