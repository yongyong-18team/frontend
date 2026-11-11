// e2e/helpers.ts
// 여러 테스트에서 같이 쓰는 동작 (로그인, 기록 쓰기·분석·승인)

import { expect, type Page } from '@playwright/test';

/** 가짜 서버 개발용 계정 (src/lib/api/mock/auth.ts) */
export const OWNER = { id: 'demo1234', password: 'demo1234' };
export const CO = { id: 'co1234', password: 'co1234' };

/** 지금 보이는 화면의 <main> (Next.js가 지나간 화면을 숨긴 채 남겨 둘 수 있어서 보이는 것만) */
export const visibleMain = (page: Page) => page.locator('main:visible');

export async function login(page: Page, { id, password }: { id: string; password: string }) {
  await page.goto('/login');
  await page.getByPlaceholder('아이디를 입력해 주세요').fill(id);
  await page.getByPlaceholder('비밀번호를 입력해 주세요').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/home/);
}

/** 로그아웃: 토큰·대상자만 지우고 가짜 DB(기록)는 남김 → 다른 계정으로 같은 기록을 볼 수 있음 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('yongyong.')) localStorage.removeItem(key);
  });
}

/** 2.1 기록 쓰기 → 2.2 분석 결과까지. 결과 화면 주소의 diaryId를 돌려줌 */
export async function writeAndAnalyze(page: Page, content: string) {
  await page.goto('/diary/new');
  await page.getByPlaceholder('오늘 있었던 일을 기록해 주세요.').fill(content);
  await page.getByRole('button', { name: 'AI로 분석하기' }).click();
  await expect(page).toHaveURL(/\/diary\/\d+\/result/);
  return Number(page.url().match(/\/diary\/(\d+)\//)![1]);
}

/** 2.2 → 2.3 → 모든 항목 승인 → 반영 → 2.4 목록 */
export async function approveAll(page: Page) {
  // 가짜 분석은 3초 걸림
  await page.getByRole('button', { name: '추출 정보 검토하기' }).click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/review/);
  const approveButtons = visibleMain(page).getByRole('button', { name: '승인', exact: true });
  await expect(approveButtons.first()).toBeVisible();
  const count = await approveButtons.count();
  for (let i = 0; i < count; i++) await approveButtons.first().click();
  await page.getByRole('button', { name: /항목 반영하기|설명서에 반영하기/ }).click();
  await expect(page).toHaveURL(/\/diary\?done=reflected/);
  return count;
}
