import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { fixtureLabel } from '../src/fixture.mjs';

test('neutral JavaScript fixture can be imported', () => {
  assert.equal(fixtureLabel, 'Development environment fixture');
});

test('runtime globals are scoped and undeclared names still fail', async () => {
  const eslint = new ESLint();
  const [valid] = await eslint.lintText(
    'export const runtime = [process, console, URL, AbortController, AbortSignal, setTimeout, clearTimeout];',
    { filePath: 'tests/runtime.test.mjs' },
  );

  assert.equal(valid.errorCount, 0);
  const [browser] = await eslint.lintText('export const runtime = window;', { filePath: 'src/main.ts' });

  assert.equal(browser.errorCount, 0);
  const [invalid] = await eslint.lintText('export const runtime = missingName;', {
    filePath: 'tests/runtime.test.mjs',
  });

  assert.equal(invalid.messages[0].ruleId, 'no-undef');
  const [nodeOnly] = await eslint.lintText('export const runtime = window;', { filePath: 'tests/runtime.test.mjs' });

  assert.equal(nodeOnly.messages[0].ruleId, 'no-undef');
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
