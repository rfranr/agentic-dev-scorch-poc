import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStructure } from '../scripts/run-structure.mjs';

test('structure preserves an upstream failure even if JSON was produced', () => {
  const calls = [];
  const run = (command, args) => {
    calls.push({ command, args });

    return { status: 7, stdout: '{"modules":[]}', stderr: '' };
  };

  assert.equal(runStructure(run), 7);
  assert.equal(calls.length, 1);
});

test('structure reports successful analysis and reporter execution', () => {
  const calls = [];
  const run = (command, args, options) => {
    calls.push({ command, args, options });

    return calls.length === 1 ? { status: 0, stdout: '{"modules":[]}', stderr: '' } : { status: 0 };
  };

  assert.equal(runStructure(run), 0);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.input, '{"modules":[]}');
});

test('structure propagates reporter failure', () => {
  let calls = 0;
  const run = () => {
    calls += 1;

    return calls === 1 ? { status: 0, stdout: '{"modules":[]}', stderr: '' } : { status: 9 };
  };

  assert.equal(runStructure(run), 9);
});
