import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { readFile } from 'node:fs/promises';

test('Scorch browser shell declares its title, status, and TypeScript entry', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /<title>Scorch<\/title>/);
  assert.match(html, /role="status"/);
  assert.match(html, /Gameplay is not implemented yet/);
  assert.match(html, /type="module" src="\/src\/main\.ts"/);
});

test('runtime globals are scoped and undeclared names still fail', async () => {
  const eslint = new ESLint();
  const [valid] = await eslint.lintText(
    'export const runtime = [process, console, URL, AbortController, AbortSignal, setTimeout, clearTimeout];',
    { filePath: 'tests/runtime.test.mjs' },
  );

  assert.equal(valid.errorCount, 0);
  const [browser] = await eslint.lintText('export const runtime = [window, document, requestAnimationFrame];', {
    filePath: 'src/browser/runtime.mjs',
  });

  assert.equal(browser.errorCount, 0);
  const [invalid] = await eslint.lintText('export const runtime = missingName;', {
    filePath: 'tests/runtime.test.mjs',
  });

  assert.equal(invalid.messages[0].ruleId, 'no-undef');
  const [nodeOnly] = await eslint.lintText('export const runtime = window;', { filePath: 'tests/runtime.test.mjs' });

  assert.equal(nodeOnly.messages[0].ruleId, 'no-undef');
  const [simulation] = await eslint.lintText('export const runtime = [window, document, process];', {
    filePath: 'src/simulation/runtime.mjs',
  });

  assert.equal(simulation.errorCount, 3);
  assert.ok(simulation.messages.every((message) => message.ruleId === 'no-undef'));
});

test('maintained scripts use Node globals without allowing browser or unknown globals', async () => {
  const eslint = new ESLint();
  const [valid] = await eslint.lintText(
    'export const runtime = [process, console, URL, AbortController, AbortSignal, setTimeout, clearTimeout];',
    { filePath: 'scripts/runtime-probe.mjs' },
  );

  assert.equal(valid.errorCount, 0);
  const [invalid] = await eslint.lintText('export const runtime = [window, missingName];', {
    filePath: 'scripts/runtime-probe.mjs',
  });

  assert.equal(invalid.errorCount, 2);
  assert.ok(invalid.messages.every((message) => message.ruleId === 'no-undef'));
});
