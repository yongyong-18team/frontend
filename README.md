<p align="center">
  <img src="https://raw.githubusercontent.com/yongyong-18team/.github/main/profile/logo.png" alt="돌봄바통 로고" width="120">
</p>

# 돌봄바통 (Dolbom Baton) — Frontend

> **오늘의 돌봄을 기록하고, 다음 돌봄으로 이어주는 AI 기반 발달장애인 돌봄 지원 서비스**

보호자가 쓰는 모바일 웹입니다. 돌봄을 음성이나 텍스트로 기록하고, AI가 정리한 정보를 승인해 돌봄 설명서를 만들고, 링크 하나로 다음 돌봄 제공자에게 넘겨줍니다. 2026 용용톤 복지 트랙 출품작이며 가상 데이터만 사용합니다.

| 바로가기 | |
|---|---|
| 서비스 | https://yongyong-18team-frontend.vercel.app |
| 서비스 소개 | [yongyong-18team](https://github.com/yongyong-18team) 조직 페이지 |
| 백엔드 · 설계 문서 | [yongyong-18team/backend](https://github.com/yongyong-18team/backend) |

## 주요 화면

| 경로 | 화면 |
|---|---|
| `/login`, `/onboarding` | 로그인·회원가입, 보호자·대상자·돌봄 프로필 등록 |
| `/home` | 오늘의 기록, 바로가기, 최근 기록 |
| `/diary` | 음성·텍스트 돌봄 기록, AI 분석 결과 검토·승인, 일일 기록 |
| `/guide` | 돌봄 설명서 조회·수정 |
| `/report` | 주간 돌봄 리포트 |
| `/share` | 공유할 문서·섹션 선택, 링크 발급, 공유 내역과 접근 중지 |
| `/s/[token]` | 받은 사람이 로그인 없이 보는 공유 페이지 |
| `/support` | 조건별 용인시 돌봄시설·지원제도 찾기 |
| `/crisis` | 위기 표현 감지 시 안전 안내 |
| `/settings` | 공동 관리자 초대·관리 |

## 기술 스택

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Playwright(E2E), Vercel(GitHub Actions로 `main` 자동 배포)

## 로컬 실행

준비물: Node.js 22

```bash
npm install
npm run dev        # http://localhost:3000
```

환경변수는 `.env.local`에 둡니다. 아무것도 넣지 않으면 모든 API가 `src/lib/api/mock`의 가짜 서버로 동작해 백엔드 없이 화면을 볼 수 있습니다.

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 주소. 요청은 `{주소}/api/v1/...`로 갑니다 |
| `NEXT_PUBLIC_REAL_API` | 실제 서버로 보낼 API 묶음. 쉼표로 나열(`auth,onboarding`)하거나 `all` |
| `NEXT_PUBLIC_AUTH_GUARD` | `off`면 로그인 확인을 끕니다 (개발용) |

E2E 테스트: `npm run test:e2e`

## 폴더 구조

```
src
 ├─ app          화면 (경로별 폴더)
 ├─ components   화면별·공통 컴포넌트
 ├─ hooks        공통 훅
 ├─ lib          API 클라이언트, 인증, 화면 로직
 │   └─ api/mock 가짜 서버
 ├─ mocks        가짜 데이터
 └─ constants    문구·상수
```

## 팀

FE [Sehoon-Jeong](https://github.com/Sehoon-Jeong) · [imly-dia](https://github.com/imly-dia) — 팀 전체 소개는 [조직 페이지](https://github.com/yongyong-18team)에 있습니다.
