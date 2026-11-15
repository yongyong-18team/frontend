# 프론트엔드 협업 규칙

프론트 2명(A·B)이 같은 레포에서 부딪히지 않고 작업하기 위한 규칙이다. 지금까지 실제로 해 온 방식을 정리했다.
Next.js 관련 AI 규칙은 `AGENTS.md`에 있다.

## 0. 흐름 한 줄 요약

브랜치 → PR → E2E·미리보기 배포 → Squash Merge → 운영 자동 배포

- `main`에 머지되면 GitHub Actions가 Vercel 운영 주소로 배포한다.
- PR을 올리면 PR 전용 미리보기 주소로 배포되고, E2E 테스트가 자동으로 돈다.

## 1. 처음 받았을 때

준비물은 Node.js 22다.

```bash
git clone https://github.com/yongyong-18team/frontend.git
cd frontend
npm install
npm run dev
```

http://localhost:3000 이 열리면 끝. 첫 주소(`/`)는 홈(`/home`)으로, 로그인 전이면 로그인 화면으로 간다.

### 환경 변수 (`.env.local`)

프로젝트 폴더 맨 위에 `.env.local` 파일을 만든다. 이 파일은 커밋되지 않는다.

```
NEXT_PUBLIC_API_BASE_URL=https://batong-team18.duckdns.org
NEXT_PUBLIC_REAL_API=auth,terms,onboarding,crisis,diary,report,home,guide,share,member,resource
```

- `NEXT_PUBLIC_API_BASE_URL`은 백엔드 서버 주소다. `/api/v1`은 붙이지 않고 도메인까지만 적는다. API 문서(Swagger)는 이 주소 뒤에 `/swagger-ui/index.html`을 붙이면 열린다.
- `NEXT_PUBLIC_REAL_API`에 적은 API 묶음만 실제 서버로 가고, 나머지는 가짜 서버(mock)로 동작한다.
- 전부 실제 서버: `all` / 전부 가짜 서버: 비워 두기
- 값을 바꾸면 `npm run dev`를 껐다 켜야 반영된다.
- 묶음 이름은 `src/lib/api/realApi.ts`에 있다.

### 가짜 서버 테스트 계정

| 계정 | 비밀번호 | 역할 |
| --- | --- | --- |
| `demo1234` | `demo1234` | 주 보호자(OWNER), 대상자 "민준" |
| `co1234` | `co1234` | 같은 대상자의 공동 관리자 |

가짜 서버 데이터는 브라우저 localStorage에만 저장된다. `/diary?seed`로 예시 기록을 넣고 `/diary?reset`으로 지운다.

## 2. 역할 분담

| 담당 | 화면 |
| --- | --- |
| **A** | 0.1 로그인·회원가입 / 0.2-1~0.2-4 온보딩 / 1.1 홈 / 2.1~2.5 기록·분석·검토·목록·주간 리포트 / 공동 관리자용 2.4 / 5.5 위기 안내 |
| **B** | 3.1·3.2 돌봄 설명서 / 4.1~4.4 공유 / 5.0~5.4 돌봄 지원 / 6.1~6.3 계정·공동 관리자 / 디자인(Figma) |

### 파일 담당

| 담당 | 위치 |
| --- | --- |
| **A** | `src/app/login` `onboarding` `home` `diary` `report` `crisis`, `src/components/auth` `onboarding` `home` `diary` `report`, `src/lib/api/client.ts` `auth.ts` `onboarding.ts` `home.ts` `diary.ts` `dailyRecord.ts` `report.ts` `crisis.ts`, `src/lib/api/mock/`, `src/lib/auth/`, `e2e/`, `.github/workflows/` |
| **B** | `src/app/guide` `share` `s` `support` `settings`, `src/components/common` `icons` `share` `support`, `src/lib/api/guide.ts` `share.ts` `member.ts` `resource.ts`, `src/mocks/`, `src/app/globals.css`(디자인 토큰) |
| **같이 씀** | `src/app/layout.tsx`, `src/lib/api/realApi.ts`, `package.json` |

- **상대 담당 파일은 직접 고치지 않는다.** 필요한 변경은 상대에게 요청한다.
- 급해서 상대 파일을 고쳐야 하면 PR 설명에 어떤 파일을 왜 고쳤는지 적고 상대에게 알린다.
- 같이 쓰는 파일을 고치면 PR 설명에 적는다. 특히 `realApi.ts`는 상대가 추가한 묶음 이름을 지우지 않았는지 확인한다.

## 3. 브랜치

- `main` 하나만 쓴다. `main`은 항상 배포 가능한 상태다.
- `main`에 직접 push하지 않는다. 항상 브랜치를 만들어 PR로 올린다.
- 작업 브랜치는 **최신 `main`에서** 만든다.

```bash
git checkout main
git pull origin main
git checkout -b fix/crisis-rest-link
```

- 이름은 `{type}/{짧은 설명}`이다. 예: `feat/daily-share`, `fix/root-to-home`, `test/e2e`
- `git pull origin main`은 `main` 브랜치에서만 한다. 작업 브랜치에서 하면 합치기 커밋이 생긴다.
- 머지된 브랜치에 커밋을 더 올리지 않는다. 새 작업은 새 브랜치에서 한다.
- 머지한 뒤에는 PR 화면의 **Delete branch**를 누른다.

## 4. 커밋 메시지

```
<type>: <요약>
```

| type | 언제 |
| --- | --- |
| feat | 기능 추가 |
| fix | 버그 수정, 문구·화면 수정 |
| test | 테스트만 추가·수정 |
| docs | 문서 |
| chore | 설정, 이름 변경 등 |
| ci | GitHub Actions, 배포 |

요약은 한국어로, 무엇을 했는지 쓴다. 화면 번호나 API ID가 있으면 넣는다.

```
feat: 공동 관리자 2.4 (REPORT-01·02), manifest·앱 아이콘
fix: 5.5 가족휴식지원 링크를 서버의 제도 번호로 연결
test: Playwright E2E 자동 테스트 추가
ci: 크롬 부품 설치는 3분만 기다리고 넘어가기
```

Squash Merge라서 `main`에 남는 건 PR 제목이다. PR 제목도 같은 형식으로 쓴다.

## 5. PR

- 본문에 **무엇을 왜 바꿨는지, 바뀐 파일, 확인 방법**을 적는다.
- 상대 담당 파일이나 같이 쓰는 파일을 고쳤으면 "확인 부탁" 항목으로 적는다.
- Figma나 기획 문서에 없어서 임시로 정한 문구·위치가 있으면 적는다.
- 관련 이슈가 있으면 `Closes #이슈번호`를 넣는다.
- **머지 전 확인**: E2E 초록 체크. PR 미리보기 주소에서 화면 확인.
- 머지는 작성자가 **Squash and merge**로 한다.
- 머지하면 1~2분 뒤 운영 주소에 반영된다. Actions 탭의 "Deploy to Vercel"이 초록 체크면 배포가 끝난 것이다.

## 6. 테스트 (E2E)

Playwright로 실제 브라우저를 띄워 화면을 자동으로 확인한다. 전부 가짜 서버로 돌아서 백엔드 상태와 상관없다.

```bash
npx playwright install chromium   # 처음 한 번
npm run test:e2e                  # 전체 실행
npm run test:e2e:ui               # 화면을 보면서 한 단계씩
npm run test:e2e:report           # 마지막 결과 보기
```

- 테스트용 서버는 3100번 포트에 따로 뜬다. 켜 둔 `npm run dev`(3000)와 겹치지 않는다.
- 테스트는 버튼·문구 글자로 화면을 찾는다. **문구를 바꾸면 `e2e/*.spec.ts`의 글자도 같이 바꾼다.**
- 기능을 추가하면 그 흐름의 테스트도 같이 추가한다.
- 테스트를 통과시키려고 기대값만 바꾸지 않는다. 화면이 달라진 이유를 먼저 확인한다.
- 자세한 내용은 `e2e/README.md`에 있다.

## 7. 실제 서버 연결

- API 함수는 `src/lib/api/`에 둔다. 화면에서 `fetch`를 직접 부르지 않고 `api.get` / `api.post`(`client.ts`)를 쓴다.
- 함수마다 `isReal('묶음 이름')`으로 실제 서버와 가짜 서버를 나눈다.

```ts
export async function getHome(): Promise<HomeData> {
  if (isReal('home')) return api.get<HomeData>(subjectPath('/home'));
  // ── 가짜 응답 ──
  ...
}
```

- 응답은 `{ success, data, error: { code, message } }` 형식이고 `client.ts`가 `data`만 꺼내 준다.
- 로그인이 만료되면(401) `client.ts`가 로그인 화면으로 보낸다.
- 서버 응답에 아직 없는 필드는 선택 값(`?`)으로 두고, 없으면 화면에서 그 부분을 숨긴다.
- 명세와 실제 응답이 다르면 임의로 맞추지 말고 백엔드에 먼저 확인한다.

## 8. 화면을 만들 때

- 문구는 **기획 문구 확정안**을 따른다. 문서에 없는 문구를 임시로 넣으면 PR에 적고 기획에 확인한다.
- 화면 모양은 **Figma**를 따른다. Figma에 없는 화면·버튼은 `TODO(디자인)` 주석을 남기고 PR에 적는다.
- 색·글꼴 크기는 `globals.css`의 디자인 토큰(`bg-primary-strong`, `text-text-secondary` 등)을 쓴다.
- 버튼·칩·헤더·빈 화면·오류 화면은 `src/components/common`의 공용 컴포넌트를 쓴다.
- 화면마다 **불러오는 중 / 성공 / 오류 / 빈 상태**를 따로 보여 준다.
- 오류가 나도 사용자가 입력한 내용은 지우지 않는다.
- 글씨로 된 작은 버튼도 누르는 영역은 44px 이상으로 한다.
- 주소의 값(`params`)을 읽는 페이지는 같은 폴더에 `loading.tsx`를 둔다.
- 서버가 아직 지원하지 않는 기능은 버튼을 숨긴다. 코드를 지우지 말고 스위치로 감춰 나중에 다시 켤 수 있게 한다.

## 9. 배포

- 배포는 GitHub Actions(`.github/workflows/deploy.yml`)가 한다. Vercel의 Git 자동 배포는 꺼져 있다(`vercel.json`).
- 환경 변수는 Vercel 프로젝트 **Settings → Environment Variables**에 있다(Production·Preview).
- **환경 변수를 바꾸면 다시 배포해야 반영된다.** Actions 탭 → Deploy to Vercel → Run workflow.
- 배포에 쓰는 토큰은 GitHub Secrets에 있다. 코드나 PR에 적지 않는다.

## 10. 공개 레포 규칙

이 레포는 Public이다. 코드, 커밋, 이슈, PR 코멘트, Actions 로그까지 누구나 볼 수 있다.

**올리지 않는 것**

- `.env.local`, API 키, 토큰, 비밀번호
- 실제 사람의 이름·전화번호·주소. 테스트 데이터는 지어낸 것만 쓴다
- 캡처나 로그를 붙일 때 토큰과 실제 기록 내용은 가리고 붙인다
- 기획서·PRD 원본

**커밋 전에**

- `git status`로 올라가는 파일을 한 번 본다. `git add .` 전에 특히.
- 키를 실수로 올렸다면 바로 팀에 알리고, 그 키를 발급한 곳에서 폐기·재발급한다.

## 11. AI 활용

- AI가 쓴 코드도 내 코드다. 직접 실행하고 화면에서 눌러 본다.
- 요청할 때 **화면 번호·API ID, 고쳐도 되는 파일 범위**를 같이 준다. 상대 담당 파일은 고치지 말라고 적는다.
- AI가 준 파일을 덮어쓰기 전에 그 사이 `main`이 바뀌지 않았는지 확인한다. 오래된 파일을 덮어쓰면 상대의 변경이 지워진다.
- 명세·기획에 없는 필드나 화면을 AI가 만들었으면 되돌리고 팀에 묻는다.
- `.env.local`, 토큰, 실제 사람 정보는 AI에게 넣지 않는다.

## 12. 자주 막히는 곳

| 증상 | 해결 |
| --- | --- |
| `git checkout main`에서 "local changes would be overwritten" | `git stash` → 브랜치 이동 → `git stash pop` |
| `git pull` 후 이상한 편집 화면(vim)이 뜸 | `:q!` 입력 후 Enter → `git merge --abort`. 작업 브랜치에서 pull한 것이다. `main`으로 옮겨서 다시 |
| push했는데 PR에 커밋이 안 보임 | 이미 머지된 브랜치에 올린 것. 새 브랜치에서 `git cherry-pick <커밋>` 후 새 PR |
| `'@playwright/test' 모듈을 찾을 수 없습니다` | `npm install` |
| 환경 변수를 바꿨는데 그대로임 | 로컬은 `npm run dev` 재시작, 배포는 Run workflow로 다시 배포 |
| 배포했는데 화면이 예전 그대로 | 브라우저 새로고침(Ctrl+Shift+R). 폰은 탭을 닫았다 다시 열기 |
| E2E가 "Install Playwright Chromium"에서 실패 | GitHub 서버 네트워크 문제. 코드 문제 아님. 나중에 Re-run |
| E2E가 "npm run test:e2e"에서 실패 | 실행 화면 아래 Artifacts의 `playwright-report`를 내려받아 어느 화면에서 멈췄는지 확인 |
| 녹음해도 예시 문장만 나옴 | `NEXT_PUBLIC_REAL_API`에 `diary`가 없어 가짜 서버로 동작 중 |
| 개발 중 "instant navigation" 경고 | 개발 모드에서만 뜨는 안내. 무시해도 됨 |

## 13. 막혔을 때

- 30분 넘게 막히면 혼자 붙잡지 말고 팀 채널에 올린다. 무엇을 하려는지, 무엇을 해 봤는지, 오류 화면을 같이 올린다.
- 명세·기획이 모호하면 임의로 정하지 않고 묻는다. 정해진 내용은 이슈나 PR에 한 줄 남긴다.
