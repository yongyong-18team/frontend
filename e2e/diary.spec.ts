// e2e/diary.spec.ts — 2.1 기록 → 2.2 분석 → 2.3 승인 → 2.4 목록, 삭제, 1.1 홈 반영, 5.5 위기 안내

import { expect, test } from '@playwright/test';

import { approveAll, login, OWNER, visibleMain, writeAndAnalyze } from './helpers';

const DIARY = '오후에 공사 소리가 나자 30분 넘게 소리를 질렀어요. 트로트를 틀어주니 진정했어요.';

test.beforeEach(async ({ page }) => {
  await login(page, OWNER);
});

test('기록 → 분석 → 승인 → 목록에 "승인 완료"', async ({ page }) => {
  await writeAndAnalyze(page, DIARY);
  const approved = await approveAll(page);
  expect(approved).toBeGreaterThan(0);

  const main = visibleMain(page);
  await expect(main.getByText('선택한 정보가 돌봄 설명서에 반영됐어요.')).toBeVisible();
  await expect(main.getByText('승인 완료')).toBeVisible();
  await expect(main.getByText('오후에 공사 소리가 나자', { exact: false })).toBeVisible();
});

test('승인한 기록이 1.1 홈 최근 기록에 보임', async ({ page }) => {
  await writeAndAnalyze(page, DIARY);
  await approveAll(page);

  await page.goto('/home');
  const main = visibleMain(page);
  await expect(main.getByText('오늘 기록을 남겼어요')).toBeVisible();
  await expect(main.getByText('오후에 공사 소리가 나자', { exact: false })).toBeVisible();
});

test('일부만 승인하고 반영하면 확인 팝업', async ({ page }) => {
  await writeAndAnalyze(page, DIARY);
  await page.getByRole('button', { name: '추출 정보 검토하기' }).click({ timeout: 20_000 });
  await visibleMain(page).getByRole('button', { name: '승인', exact: true }).first().click();
  await page.getByRole('button', { name: '설명서에 반영하기' }).click();
  await expect(page.getByText(/검토하지 않은 항목이 \d+개 있어요/)).toBeVisible();
  await page.getByRole('button', { name: '반영하기', exact: true }).click();
  await expect(page).toHaveURL(/\/diary\?done=reflected/);
  await expect(visibleMain(page).getByText('검토 대기')).toBeVisible();
});

test('기록 삭제', async ({ page }) => {
  await writeAndAnalyze(page, DIARY);
  await page.getByRole('button', { name: '추출 정보 검토하기' }).click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/review/);
  const review = visibleMain(page);
  await expect(review.getByRole('heading', { name: '설명서 반영 여부를 선택하세요' })).toBeVisible();
  await review.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByText('이 기록을 삭제하시겠어요?')).toBeVisible();
  await page.getByRole('button', { name: '삭제하기' }).click();

  await expect(page).toHaveURL(/\/diary\?done=deleted/);
  await expect(visibleMain(page).getByText('돌봄 기록이 삭제됐어요.')).toBeVisible();
  await expect(visibleMain(page).getByText('아직 기록이 없어요')).toBeVisible();
});

test('위기 신호가 있으면 5.5 위기 안내로 (전화 연결 번호)', async ({ page }) => {
  await writeAndAnalyze(page, '오늘 아이가 죽고 싶다는 말을 했어요.');
  await expect(page).toHaveURL(/\/crisis/, { timeout: 20_000 });

  const main = visibleMain(page);
  await expect(main.getByText('안전을 가장 먼저 확인하세요')).toBeVisible();
  // 기획 문구 확정안 v1.4 5.5 번호
  for (const number of ['109', '15770199', '119', '112']) {
    await expect(main.locator(`a[href="tel:${number}"]`).first()).toBeVisible();
  }
});
