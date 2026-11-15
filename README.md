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

## 화면 소개 — 돌봄 설명서 · 공유 · 돌봄 지원 · 마이페이지

<table>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/123fc8bf-634a-41f5-86c4-b6a93c6a80da" width="180" alt="3.1 돌봄 설명서"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/404e9046-7bab-4126-813d-c119294c4314" width="180" alt="4.1 공유 범위 설정"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/dd18361e-ba47-4ede-b925-708cb800bd38" width="180" alt="5.0 돌봄 지원"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/2b3ac733-76df-46d8-8c40-4b8902e1554d" width="180" alt="6.1 마이페이지"></td>
  </tr>
  <tr>
    <td align="center"><b>돌봄 설명서</b><br><code>/guide</code></td>
    <td align="center"><b>공유</b><br><code>/share</code></td>
    <td align="center"><b>돌봄 지원</b><br><code>/support</code></td>
    <td align="center"><b>마이페이지</b><br><code>/settings</code></td>
  </tr>
</table>

> 화면 이미지는 Figma 디자인 기준이며, 이름·연락처 등은 모두 가상 데이터입니다.

### 돌봄 설명서 `/guide`

보호자가 승인한 돌봄 정보가 7개 섹션으로 쌓이는 설명서입니다.

- **조회(3.1):** 긴급 카드(이름·나이·비상 연락처·절대 금지 등)와 섹션별 카드. 카드를 누르면 항목과 날짜를 펼쳐 봅니다.
- **편집(3.2):** 기본 정보(이름·출생 연도·지역·비상 연락처)와 항목을 추가·수정·삭제한 뒤 한 번에 저장합니다.
- 상세에서 "이 항목 편집하기"를 누르면 그 섹션이 선택된 채로 편집이 열립니다.
- 저장하지 않고 나가면 확인 팝업을 띄웁니다.
- API: `GUIDE-01~04`, `SUBJ-02·03`

### 공유 `/share` · `/s/[token]`

보호자가 고른 정보만 링크 하나로 다음 돌봄 제공자에게 넘깁니다.

- **공유 범위(4.1):** 공개할 섹션을 직접 고릅니다. 내용 있는 섹션은 기본 선택, 비상 연락처는 기본 OFF입니다.
- **미리보기(4.2):** 받는 사람이 볼 화면 그대로 확인합니다. 이 미리보기가 고정본이 됩니다.
- **링크 발급·내역(4.3):** 링크는 7일 동안 열리고, 주소는 발급 화면에서 한 번만 보여 줍니다. 공유 내역에서 언제든 접근을 중지할 수 있습니다.
- **받는 사람 화면(4.4):** 로그인·앱 설치 없이 열립니다. 검색 노출 방지(`noindex`)와 주소 전달 방지(`no-referrer`)를 적용했고, 만료·중지·잘못된 링크는 각각 다른 안내를 보여 줍니다.
- 일기 원문과 보호자 감정 기록은 공유되지 않습니다.
- 이번 버전은 **돌봄 설명서 공유와 일일기록 공유**만 열려 있습니다. 주간 리포트는 화면에 보이지만 선택할 수 없고, `ShareScopeView.tsx`의 `ENABLED_TYPES`에 추가하면 열립니다.
- API: `SHARE-01~05`, `PUB-01`

### 돌봄 지원 `/support`

용인시 돌봄시설과 지원제도를 조건별로 찾습니다.

- **찾기(5.1):** 돌봄 유형(단기/장기)과 필요한 날짜, 지역을 고릅니다. 지역은 대상자 등록 지역으로 채워집니다.
- **결과(5.2):** 전체 / 시설 / 제도로 나눠 봅니다. 단기 돌봄 시설이 없으면 시설을 억지로 추천하지 않고 관련 제도와 문의처를 안내합니다.
- **상세(5.3):** 지원 대상·내용·신청 방법과 전화·공식 안내 링크. 값이 없는 칸은 "기관에 문의" 안내를 보여 주고, 전화·주소·URL이 없으면 숨깁니다. 제도는 종류별 아이콘으로 구분합니다.
- **보호자 휴식 안내(5.4):** 진단처럼 들리는 표현을 피하고, 이용할 수 있는 휴식·상담 제도로 연결합니다.
- API: `RES-01·02`, `SUP-01`

### 마이페이지(설정) `/settings`

가족 또는 기타 보호자와 함께 돌볼 수 있도록 공동 관리자를 초대하고 관리합니다.

- **마이페이지(6.1):** 내 정보, 공동 관리자 목록, 대기 중인 초대. 로그아웃·탈퇴는 확인 팝업을 거칩니다.
- **초대(6.2):** 주 보호자만 초대할 수 있습니다. 아이디로 계정을 확인한 뒤 초대하고, 본인·중복 초대는 막습니다.
- **받은 초대(6.2.1):** 수락하면 그 대상자로 바로 전환됩니다.
- **관리(6.3):** 해제하면 그 사람이 만든 공유 링크도 서버에서 함께 중지됩니다.
- 공동 관리자는 설명서 조회·공유·지원 정보만 볼 수 있고, 일기 원문은 볼 수 없습니다.
- API: `USER-01·03`, `MEMBER-01~03`, `INVITE-01~06`

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
