import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium, type Page } from 'playwright';
import { createServer } from 'vite';

async function forceResolutionTimeout(page: Page): Promise<void> {
  // Exercise the real timeout without depending on a randomly unstable landscape.
  await page.route('**/src/simulation/game.ts', async (route) => {
    const response = await route.fetch();
    const source = await response.text();

    assert.ok(source.includes('game.resolutionSeconds += seconds;'));
    await route.fulfill({
      response,
      body: source.replace('game.resolutionSeconds += seconds;', 'game.resolutionSeconds += 11;'),
    });
  });
}

async function verifyRestart(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New match' }).click();
  await page.waitForFunction(() => document.getElementById('status')?.dataset.phase === 'aiming');
  assert.equal(await page.locator('#fire').isEnabled(), true);
  await page.locator('#battlefield').click({ position: { x: 650, y: 160 } });
  await page.waitForFunction(() => document.getElementById('status')?.dataset.phase === 'flying');
  const firstFlightImage = await page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());

  await page.waitForFunction(
    (image) => (document.querySelector('canvas') as HTMLCanvasElement).toDataURL() !== image,
    firstFlightImage,
  );
}

test('resolution timeout leaves the animation loop available for restart', { timeout: 20000 }, async (context) => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });

  context.after(() => server.close());
  await server.listen();
  const browser = await chromium.launch({ headless: true });

  context.after(() => browser.close());
  const page = await browser.newPage();
  const diagnostics: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.push(message.text());
    }
  });
  await forceResolutionTimeout(page);
  await page.goto(server.resolvedUrls!.local[0]);
  await page.waitForFunction(() => document.getElementById('status')?.dataset.phase === 'aiming');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.getElementById('status')?.dataset.phase === 'error');
  assert.match(await page.locator('#status').innerText(), /New match/);
  assert.equal(await page.locator('#fire').isDisabled(), true);
  assert.ok(diagnostics.some((message) => message.includes('Shot resolution exceeded 10 seconds')));
  await verifyRestart(page);
});
