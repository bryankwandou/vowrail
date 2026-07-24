import { expect, test } from '@playwright/test';

const liveReceipt = process.env.VOWRAIL_E2E_RECEIPT;

for (const route of ['/', '/app', '/studio', '/lab', '/receipts']) {
  test(`${route} renders without page errors`, async ({ page }) => { const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message)); await page.goto(route); await expect(page.locator('body')).toBeVisible(); expect(errors).toEqual([]); });
}

test('checkout lab returns a real 402 challenge', async ({ page }) => {
  await page.goto('/lab');
  await page.getByRole('button', { name: /Send unpaid request/ }).click();
  await expect(page.getByText('402 Payment Required')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('0.1 SOL')).toBeVisible();
});

test('checkout lab runs a complete agent preflight trace', async ({ page }) => {
  await page.goto('/lab');
  await page.getByRole('button', { name: /Run agent preflight/ }).click();
  await expect(page.getByRole('region', { name: 'Agent policy trace' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Policy passed')).toBeVisible();
  await expect(page.getByText('Groq operator explanation')).toBeVisible();
  await expect(page.locator('[data-agent-state=ready]')).toContainText('Ready for wallet');
});

test('checkout lab verifies a live receipt', async ({ page }) => {
  test.skip(!liveReceipt, 'VOWRAIL_E2E_RECEIPT is not configured');
  await page.goto('/lab');
  await page.getByLabel('Receipt PDA').fill(liveReceipt!);
  await page.getByRole('button', { name: /Verify and unlock/ }).click();
  await expect(page.getByText('Receipt accepted. Resource released.')).toBeVisible({ timeout: 60_000 });
});

test('policy studio blocks and approves deterministic intents', async ({ page }) => {
  await page.goto('/studio');
  const amount = page.getByLabel('Requested amount in SOL');
  await amount.fill('8'); await page.getByRole('button', { name: /Simulate intent/ }).click(); await expect(page.locator('.sim-output')).toContainText('BLOCK');
  await amount.fill('2.4'); await page.getByLabel('Requested slippage in bps').fill('35'); await page.getByLabel('Program').selectOption({ label: 'Jupiter v6' }); await page.getByRole('button', { name: /Simulate intent/ }).click(); await expect(page.locator('.sim-output')).toContainText('APPROVE');
  const createReceipt = page.getByRole('button', { name: /Create devnet receipt/ });
  await expect(createReceipt).toBeEnabled();
  await amount.fill('2.5');
  await expect(createReceipt).toBeDisabled();
});

test('wallet connection reports a provider-backed state', async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { solana: { connect: () => Promise<{ publicKey: { toString: () => string } }> } }).solana = { connect: async () => ({ publicKey: { toString: () => '8oVowrailWallet11111111111111111111111111111' } }) }; });
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Connect devnet wallet' }).click();
  await expect(page.locator('[data-wallet-state=connected]')).toContainText('8oVo...1111');
});

for (const route of ['/', '/app', '/studio', '/lab', '/receipts']) {
  test(`${route} has no mobile horizontal overflow`, async ({ page }) => { await page.setViewportSize({ width: 375, height: 812 }); await page.goto(route); await expect(page.locator('body')).toBeVisible(); const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); expect(overflow).toBeLessThanOrEqual(1); });
}
