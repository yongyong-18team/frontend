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
  // 홈 누적 일수 (HOME-01 careDays): 오늘 첫 기록 → 1일째
  await expect(main.getByText('1일째')).toBeVisible();
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
  // 5.3 연결: 부모상담 지원 + 가족휴식지원 (가족휴식지원 번호는 SUP-01에서 찾음)
  await expect(main.getByRole('link', { name: /가족휴식지원/ })).toHaveAttribute('href', '/support/1102');
  await main.getByRole('link', { name: /가족휴식지원/ }).click();
  await expect(page).toHaveURL(/\/support\/1102/);
  await expect(visibleMain(page).getByText('지원 정보를 찾을 수 없어요', { exact: false })).toHaveCount(0);
});

test('쓰다가 로그인이 만료돼도 다시 로그인하면 쓰던 내용이 남아 있음 (PRD 5-5)', async ({ page }) => {
  await page.goto('/diary/new');
  await page.getByPlaceholder('오늘 있었던 일을 기록해 주세요.').fill(DIARY);

  // 로그인 만료: 토큰을 지우고 로그인 화면으로 (실제로는 API가 401을 받으면 이렇게 됨)
  await page.evaluate(() => {
    localStorage.removeItem('yongyong.accessToken');
    localStorage.removeItem('yongyong.tokenExpiresAt');
  });
  await page.goto('/login?expired=1&next=%2Fdiary%2Fnew');
  await page.getByPlaceholder('아이디를 입력해 주세요').fill(OWNER.id);
  await page.getByPlaceholder('비밀번호를 입력해 주세요').fill(OWNER.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  await expect(page).toHaveURL(/\/diary\/new/);
  await expect(page.getByPlaceholder('오늘 있었던 일을 기록해 주세요.')).toHaveValue(DIARY);
  await expect(page.getByText('작성하던 내용을 불러왔어요.')).toBeVisible();

  // 저장하면 임시 저장은 지워짐 → 새로 들어오면 빈 칸
  await page.getByRole('button', { name: 'AI로 분석하기' }).click();
  await expect(page).toHaveURL(/\/diary\/\d+\/result/);
  await page.goto('/diary/new');
  await expect(page.getByPlaceholder('오늘 있었던 일을 기록해 주세요.')).toHaveValue('');
});

test('글씨로 된 작은 버튼도 누르는 영역이 44px 이상 (PRD 5-5)', async ({ page }) => {
  await writeAndAnalyze(page, DIARY);
  await page.getByRole('button', { name: '추출 정보 검토하기' }).click({ timeout: 20_000 });
  const del = visibleMain(page).getByRole('button', { name: '삭제', exact: true });
  const box = (await del.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);

  await page.goto('/home');
  const all = (await visibleMain(page).getByRole('link', { name: '전체보기' }).boundingBox())!;
  expect(all.height).toBeGreaterThanOrEqual(44);
});
