// e2e/co-manager.spec.ts — 공동 관리자 2.4 (REPORT-01 목록 · REPORT-02 상세)
// OWNER(demo1234)가 기록을 승인 → 같은 대상자의 공동 관리자(co1234)로 로그인해서 확인

import { expect, test } from '@playwright/test';

import { approveAll, CO, login, logout, OWNER, visibleMain, writeAndAnalyze } from './helpers';

test('공동 관리자는 반영된 기록만, 원문 없이 봄', async ({ page }) => {
  // OWNER: 하나는 승인, 하나는 분석만 (반영 안 됨)
  await login(page, OWNER);
  await writeAndAnalyze(page, '오후에 공사 소리가 나자 30분 넘게 소리를 질렀어요. 트로트를 틀어주니 진정했어요.');
  const approved = await approveAll(page);
  await writeAndAnalyze(page, '약을 식후 30분에 먹었어요.');
  await expect(page.getByRole('button', { name: '추출 정보 검토하기' })).toBeVisible({ timeout: 20_000 });
  await logout(page);

  // 공동 관리자: 2.4 목록
  await login(page, CO);
  await page.goto('/diary');
  const main = visibleMain(page);
  await expect(main.getByText('설명서에 반영된 기록을 날짜별로 확인하세요')).toBeVisible();
  const rows = main.getByRole('link', { name: /반영 \d+개/ });
  await expect(rows).toHaveCount(1); // 승인 안 된 기록은 안 보임
  await expect(rows.first()).toContainText(`반영 ${approved}개`);
  // OWNER용 버튼·원문은 없음
  await expect(main.getByRole('link', { name: '새 기록' })).toHaveCount(0);
  await expect(main.getByText('트로트를 틀어주니 진정했어요. ', { exact: false })).toHaveCount(0);

  // 상세: 설명서 섹션별, 삭제 버튼 없음
  await rows.first().click();
  await expect(page).toHaveURL(/\/diary\/daily\/\d+/);
  const detail = visibleMain(page);
  await expect(detail.getByText('설명서에 반영된 내용이에요')).toBeVisible();
  await expect(detail.getByRole('heading', { name: '행동 특성과 위기 대응' })).toBeVisible();
  await expect(detail.getByText('30분 넘게 소리를 질렀어요')).toBeVisible();
  await expect(detail.getByRole('button', { name: '삭제', exact: true })).toHaveCount(0);

  // 공동 관리자도 승인된 일일 기록 공유 가능 (PRD) → 4.1에서 일일 기록 선택됨
  await detail.getByRole('button', { name: '이 기록 공유하기' }).click();
  await expect(page).toHaveURL(/\/share\?documentType=DAILY&sourceDiaryId=\d+/);
  await expect(page.getByRole('radio', { name: /일일 기록/ })).toBeChecked();
});

test('공동 관리자 홈 최근 기록 → 일일 기록 상세', async ({ page }) => {
  await login(page, OWNER);
  await writeAndAnalyze(page, '오후에 공사 소리가 나자 30분 넘게 소리를 질렀어요.');
  await approveAll(page);
  await logout(page);

  await login(page, CO);
  const main = visibleMain(page);
  await expect(main.getByText('오늘도 함께 돌봐요')).toBeVisible();
  // 원문 대신 반영 개수
  await main.getByText(/설명서에 반영된 내용 \d+개/).click();
  await expect(page).toHaveURL(/\/diary\/daily\/\d+/);
  await expect(visibleMain(page).getByText('30분 넘게 소리를 질렀어요')).toBeVisible();
});

test('반영된 기록이 없으면 빈 화면', async ({ page }) => {
  await login(page, CO);
  await page.goto('/diary');
  await expect(visibleMain(page).getByText('아직 반영된 기록이 없어요.')).toBeVisible();
});
