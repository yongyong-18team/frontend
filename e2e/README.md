# E2E 자동 테스트 (Playwright)

실제 브라우저(크롬)를 띄워서 사람이 누르는 것처럼 화면을 자동으로 확인합니다.
API는 전부 **가짜 서버(mock)** 로 돌아가서, 백엔드가 꺼져 있어도 언제나 같은 결과가 나와요.

## 처음 한 번

```
npm install
npx playwright install chromium
```

## 돌리기

| 명령 | 하는 일 |
|---|---|
| `npm run test:e2e` | 전체 테스트 (약 2분). 테스트용 서버를 3100번 포트에 알아서 켜고 끔 |
| `npm run test:e2e:ui` | 창을 띄워 한 단계씩 화면을 보면서 실행 |
| `npm run test:e2e:report` | 마지막 결과를 브라우저로 보기 (실패한 화면 사진·기록 포함) |
| `npx playwright test e2e/diary.spec.ts` | 파일 하나만 |

PR을 올리면 GitHub Actions(`.github/workflows/e2e.yml`)에서도 자동으로 돌아가요.

## 무엇을 확인하나

| 파일 | 화면 |
|---|---|
| `auth.spec.ts` | 로그인 검사, 로그인 실패 문구, 로그인 → 1.1 홈, 회원가입 → 0.2 온보딩 4단계 → 홈 |
| `diary.spec.ts` | 2.1 기록 → 2.2 분석 → 2.3 승인 → 2.4 목록, 일부 승인 팝업, 삭제, 홈 최근 기록, 5.5 위기 안내 번호 |
| `co-manager.spec.ts` | 공동 관리자 2.4 목록(REPORT-01)·상세(REPORT-02), 원문 숨김, 홈에서 상세로 이동 |
| `pwa.spec.ts` | manifest·앱 아이콘·탭 제목 |

테스트 계정: `demo1234 / demo1234` (OWNER), `co1234 / co1234` (같은 대상자의 공동 관리자)

## 화면 문구를 바꿨는데 테스트가 실패하면

테스트는 버튼·문구 글자로 화면을 찾습니다. 문구를 일부러 바꿨다면 해당 `*.spec.ts`의 글자도 같이 바꿔 주세요.
