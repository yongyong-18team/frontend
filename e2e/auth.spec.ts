// e2e/auth.spec.ts — 0.1 로그인·회원가입, 0.2 온보딩, 로그인 검사(AuthGuard)

import { expect, test } from '@playwright/test';

import { login, OWNER, visibleMain } from './helpers';

test('로그인 안 한 채 홈에 가면 로그인 화면으로', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login\?next=%2Fhome/);
});

test('비밀번호가 틀리면 안내 문구', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('아이디를 입력해 주세요').fill(OWNER.id);
  await page.getByPlaceholder('비밀번호를 입력해 주세요').fill('wrong12345');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByText('아이디 또는 비밀번호가 일치하지 않습니다.')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('로그인하면 1.1 홈 (대상자 이름으로 인사)', async ({ page }) => {
  await login(page, OWNER);
  await expect(visibleMain(page).getByRole('heading', { name: '민준과 오늘도 함께해요' })).toBeVisible();
  await expect(visibleMain(page).getByText('아직 작성한 기록이 없어요.')).toBeVisible();
});

test('회원가입 → 온보딩 4단계 → 홈', async ({ page }) => {
  const loginId = `e2e${Date.now() % 1_000_000}`;

  // 0.1 회원가입
  await page.goto('/login');
  await page.getByRole('tab', { name: '회원가입' }).click();
  await page.getByPlaceholder('영문 소문자·숫자 4~20자').fill(loginId);
  await page.getByRole('button', { name: '중복 확인' }).click();
  await expect(page.getByText('사용할 수 있는 아이디예요', { exact: false })).toBeVisible();
  await page.getByPlaceholder('영문·숫자 포함 8~20자').fill('test1234');
  await page.getByRole('button', { name: '가입하기' }).click();

  // 0.2-1 보호자
  await expect(page).toHaveURL(/\/onboarding\/step-1\?joined=1/);
  await expect(page.getByText('회원가입이 완료됐어요.')).toBeVisible();
  const next = page.getByRole('button', { name: '다음' });
  await expect(next).toBeDisabled();
  await page.getByPlaceholder('이름을 입력해 주세요').fill('김보호');
  await page.getByRole('combobox', { name: /보호자 관계/ }).click();
  await page.getByRole('option', { name: '부모' }).click();
  await next.click();

  // 0.2-2 대상자
  await expect(page).toHaveURL(/\/onboarding\/step-2/);
  await page.getByPlaceholder('예) 민준이').fill('하늘');
  await page.getByRole('combobox', { name: /태어난 연도/ }).click();
  await page.getByRole('option', { name: '2010년' }).click();
  await page.getByRole('combobox', { name: '지역(구)' }).click();
  await page.getByRole('option', { name: '용인시 기흥구' }).click();
  await page.getByRole('button', { name: '다음' }).click();

  // 0.2-3 특성 (건너뛰기 가능)
  await expect(page).toHaveURL(/\/onboarding\/step-3/);
  await page.getByRole('button', { name: '다음' }).click();

  // 0.2-4 확인·동의 → 등록
  await expect(page).toHaveURL(/\/onboarding\/step-4/);
  const register = page.getByRole('button', { name: '등록 완료' });
  await expect(register).toBeDisabled();
  for (const box of await page.getByRole('checkbox').all()) await box.click();
  await register.click();

  await expect(page).toHaveURL(/\/home/);
  await expect(visibleMain(page).getByRole('heading', { name: '하늘과 오늘도 함께해요' })).toBeVisible();
});

test('로그인 화면에 아이디·비밀번호 찾기가 없음 (기획 협의로 제외)', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
  await expect(page.getByText('아이디 찾기')).toHaveCount(0);
  await expect(page.getByText('비밀번호 찾기')).toHaveCount(0);
});

test('첫 주소(/)로 들어오면 로그인 후 바로 홈', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await page.getByPlaceholder('아이디를 입력해 주세요').fill(OWNER.id);
  await page.getByPlaceholder('비밀번호를 입력해 주세요').fill(OWNER.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(visibleMain(page).getByRole('heading', { name: '민준과 오늘도 함께해요' })).toBeVisible();

  // 로그인한 상태로 / 에 가도 홈
  await page.goto('/');
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('디자인 토큰 적용 테스트')).toHaveCount(0);
});
