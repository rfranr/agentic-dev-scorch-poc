import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Page } from 'playwright';
import { createServer, preview } from 'vite';

async function setSlider(page: Page, id: string, value: number): Promise<void> {
  await page.locator(`#${id}`).evaluate((element, selectedValue) => {
    (element as HTMLInputElement).value = String(selectedValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function waitForPhase(page: Page, phase: string): Promise<void> {
  await page.waitForFunction((expected) => document.getElementById('status')?.dataset.phase === expected, phase);
}

async function canvasImage(page: Page): Promise<string> {
  return page.locator('canvas').evaluate((element) => (element as HTMLCanvasElement).toDataURL());
}

async function verifyWinningShot(page: Page): Promise<void> {
  const initialImage = await canvasImage(page);

  await page.locator('#angle').focus();
  await page.locator('#angle').press('Home');
  await page.locator('#angle').press('ArrowRight');
  await page.waitForFunction(() => document.getElementById('angle-value')?.textContent === '6°');
  await setSlider(page, 'angle', 45);
  await setSlider(page, 'power', 340);
  await page.getByRole('button', { name: 'Fire!', exact: true }).click();
  await waitForPhase(page, 'flying');
  assert.equal(await page.locator('#fire').isDisabled(), true);
  assert.equal(await page.locator('#angle').isDisabled(), true);
  assert.notEqual(await canvasImage(page), initialImage, 'projectile must be drawn');
  await waitForPhase(page, 'finished');
  assert.equal(await page.getByRole('status', { name: 'Match status' }).textContent(), 'Player 1 wins!');
  assert.equal(await page.locator('#fire').isDisabled(), true);
  assert.notEqual(await canvasImage(page), initialImage, 'impact must change the battlefield');
}

async function verifyTurnsAndRestart(page: Page): Promise<void> {
  const endedImage = await canvasImage(page);

  await page.getByRole('button', { name: 'New match' }).click();
  await waitForPhase(page, 'aiming');
  assert.match(await page.getByRole('status', { name: 'Match status' }).innerText(), /Player 1's turn/);
  assert.equal(await page.locator('#angle').inputValue(), '45');
  assert.equal(await page.locator('#power').inputValue(), '360');
  assert.notEqual(await canvasImage(page), endedImage);
  await setSlider(page, 'angle', 60);
  await setSlider(page, 'power', 180);
  await page.locator('#fire').click();
  await waitForPhase(page, 'flying');
  await waitForPhase(page, 'aiming');
  assert.match(await page.getByRole('status', { name: 'Match status' }).innerText(), /Player 2's turn/);
  assert.equal(await page.locator('#angle').inputValue(), '45', 'player two keeps their own aim');
  await setSlider(page, 'angle', 70);
  await setSlider(page, 'power', 200);
  await page.locator('#fire').click();
  await waitForPhase(page, 'flying');
  await page.getByRole('button', { name: 'New match' }).click();
  await waitForPhase(page, 'aiming');
  assert.match(await page.getByRole('status', { name: 'Match status' }).innerText(), /Player 1's turn/);
  assert.equal(await page.locator('#fire').isEnabled(), true);
}

async function verifyBrowser(context: TestContext, production: boolean): Promise<void> {
  const server = production
    ? await preview({ preview: { host: '127.0.0.1', port: 0 } })
    : await createServer({ server: { host: '127.0.0.1', port: 0 } });

  context.after(() => server.close());

  if ('listen' in server) {
    await server.listen();
  }

  const browser = await chromium.launch({ headless: true });

  context.after(() => browser.close());

  const page = await browser.newPage();
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  // The first terrain has known ballistics; subsequent matches use a new landscape.
  await page.addInitScript(() => {
    let calls = 0;

    Math.random = () => {
      calls += 1;

      return calls <= 2 ? 0.25 : 0.7;
    };
  });
  await page.goto(server.resolvedUrls!.local[0]);
  await waitForPhase(page, 'aiming');
  assert.equal(await page.title(), 'Scorch');
  await verifyWinningShot(page);
  await verifyTurnsAndRestart(page);
  assert.deepEqual(errors, []);
}

test('development browser: aiming, win, terrain change, turns, and restart', { timeout: 30000 }, async (context) => {
  await verifyBrowser(context, false);
});

test('production browser: aiming, win, terrain change, turns, and restart', { timeout: 30000 }, async (context) => {
  await verifyBrowser(context, true);
});
