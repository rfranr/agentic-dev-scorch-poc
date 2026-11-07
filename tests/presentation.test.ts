import assert from 'node:assert/strict';
import test from 'node:test';
import { createPresentation, drawShotHistory, updatePresentation } from '../src/browser/presentation';
import { createGame, fire, stepGame } from '../src/simulation/game';
import { STEP_SECONDS } from '../src/simulation/model';

test('trail starts a new path at its first sample, including above-view shots', () => {
  const presentation = createPresentation();
  const commands: unknown[] = [];
  const context = {
    beginPath: () => commands.push('begin'),
    moveTo: (x: number, y: number) => commands.push(['move', x, y]),
    lineTo: (x: number, y: number) => commands.push(['line', x, y]),
    stroke: () => commands.push('stroke'),
  } as unknown as CanvasRenderingContext2D;

  drawShotHistory(context, presentation);
  assert.deepEqual(commands, ['begin', 'stroke']);
  commands.length = 0;
  presentation.trail = [
    { x: 100, y: -20 },
    { x: 110, y: 30 },
  ];
  drawShotHistory(context, presentation);
  assert.deepEqual(commands, ['begin', ['move', 100, 6], ['line', 110, 30], 'stroke']);
});

test('shot history is bounded, survives impact, and resets on the next shot', () => {
  const game = createGame(() => 0.5);
  const presentation = createPresentation();

  fire(game);

  for (let frame = 0; frame < 30; frame += 1) {
    stepGame(game, STEP_SECONDS);
    updatePresentation(presentation, game);
  }

  assert.equal(presentation.trail.length, 24);
  assert.equal(Boolean(presentation.impact), false);

  for (let frame = 0; frame < 2000 && game.phase === 'flying'; frame += 1) {
    stepGame(game, STEP_SECONDS);
    updatePresentation(presentation, game);
  }

  assert.ok(presentation.impact);
  const impact = { ...presentation.impact };

  for (let frame = 0; frame < 100; frame += 1) {
    stepGame(game, STEP_SECONDS);
    updatePresentation(presentation, game);
  }

  assert.deepEqual(presentation.impact, impact);
  assert.equal(game.phase, 'aiming');
  fire(game);
  updatePresentation(presentation, game);
  assert.equal(presentation.impact, null);
  assert.equal(presentation.trail.length, 1);
});

test('impact guidance accounts for the firing direction of both players', () => {
  for (const player of [0, 1]) {
    const game = createGame(() => 0.5);
    const presentation = createPresentation();
    const shooter = game.tanks[player];
    const opponent = game.tanks[1 - player];

    game.activePlayer = player;
    game.phase = 'exploding';
    game.explosion = { x: opponent.x - shooter.direction * 100, y: opponent.y, ageSeconds: 0 };
    updatePresentation(presentation, game);
    assert.equal(presentation.outcome, 'SHORT OF TARGET');
    presentation.previousPhase = 'flying';
    game.explosion.x = opponent.x + shooter.direction * 100;
    updatePresentation(presentation, game);
    assert.equal(presentation.outcome, 'PAST TARGET');
  }
});

test('destruction feedback takes precedence over range guidance and restart is isolated', () => {
  const game = createGame(() => 0.5);
  const presentation = createPresentation();

  game.phase = 'exploding';
  game.explosion = { x: game.tanks[1].x, y: game.tanks[1].y, ageSeconds: 0 };
  game.tanks[1].alive = false;
  updatePresentation(presentation, game);
  assert.equal(presentation.outcome, 'P2 DESTROYED');
  const restarted = createPresentation();

  assert.equal(restarted.impact, null);
  assert.equal(restarted.trail.length, 0);
  assert.notEqual(restarted.trail, presentation.trail);
});
