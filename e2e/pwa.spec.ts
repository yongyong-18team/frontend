// e2e/pwa.spec.ts — 홈 화면에 추가(manifest·아이콘)

import { expect, test } from '@playwright/test';

test('manifest와 아이콘이 연결돼 있음', async ({ page, request }) => {
  await page.goto('/login');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const manifest = await (await request.get(href!)).json();
  expect(manifest.name).toBe('돌봄바통');
  expect(manifest.start_url).toBe('/home');
  expect(manifest.display).toBe('standalone');

  for (const icon of manifest.icons as { src: string }[]) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }

  // 아이폰 홈 화면 아이콘
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(apple!)).status()).toBe(200);
  await expect(page).toHaveTitle('돌봄바통');
});
