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
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForPhase(page, 'finished');
  assert.equal(await page.getByRole('status', { name: 'Match status' }).textContent(), 'Player 1 wins!');
  assert.equal(await page.locator('#fire').isDisabled(), true);
  assert.equal(await page.locator('#last-shot').innerText(), '', 'final status replaces shot feedback');
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

async function verifyResponsiveLayout(page: Page): Promise<void> {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    const battlefield = await page.locator('#battlefield').boundingBox();
    const fireButton = await page.locator('#fire').boundingBox();

    assert.ok(battlefield);
    assert.ok(fireButton);
    assert.equal(battlefield.width, viewport.width);
    assert.equal(battlefield.height, viewport.height);
    assert.equal(battlefield.x, 0);
    assert.equal(battlefield.y, 0);
    await page.waitForFunction(() => {
      const canvas = document.getElementById('battlefield') as HTMLCanvasElement;
      const ratio = Math.min(window.devicePixelRatio, 2);

      return (
        canvas.width === Math.round(window.innerWidth * ratio) &&
        canvas.height === Math.round(window.innerHeight * ratio)
      );
    });
    assert.ok(fireButton.width >= 44 && fireButton.height >= 44);
    assert.ok(fireButton.y + fireButton.height < viewport.height, 'Fire stays in the initial viewport');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1));
    assert.equal(await page.locator('#power-value').innerText(), '69%');
  }
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

  const page = await browser.newPage({ deviceScaleFactor: 2 });
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
  await verifyResponsiveLayout(page);
  await page.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('details').getAttribute('open'), '');
  await page.keyboard.press('Enter');
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
