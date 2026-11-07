import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../src/simulation/game';
import { STEP_SECONDS, TANK_RADIUS, WORLD } from '../src/simulation/model';
import { settleTank, terrainFromSurface } from '../src/simulation/terrain';
import { stepTank, walkTank } from '../src/simulation/tank-physics';

function fixture(surface: (x: number) => number) {
  const game = createGame(() => 0.5);

  game.terrain = terrainFromSurface(surface);
  game.tanks[0].x = 100;
  game.tanks.forEach((tank) => settleTank(tank, game.terrain));

  return game;
}

function walk(game: ReturnType<typeof createGame>, direction: number, ticks = 120) {
  for (let tick = 0; tick < ticks; tick += 1) {
    stepGame(game, STEP_SECONDS, direction);
  }
}

test('held movement is continuous, reversible and does not change aim or turn', () => {
  const game = fixture(() => 300);

  walk(game, 1);
  assert.ok(Math.abs(game.tanks[0].x - 148) < 0.001);
  walk(game, -1);
  assert.ok(Math.abs(game.tanks[0].x - 100) < 0.001);
  assert.equal(game.phase, 'aiming');
  assert.equal(game.activePlayer, 0);
  assert.equal(game.tanks[0].angle, 45);
  assert.equal(game.projectile, null);
});

test('small steps and slopes are climbed, high walls block the whole body', () => {
  const steps = fixture((x) => 300 - Math.floor(x / 30) * 2);
  const initialY = steps.tanks[0].y;

  walk(steps, 1, 240);
  assert.ok(steps.tanks[0].x > 190);
  assert.ok(steps.tanks[0].y < initialY);
  const wall = fixture((x) => (x >= 140 ? 240 : 300));

  walk(wall, 1, 240);
  assert.ok(wall.tanks[0].x < 128);
  assert.equal(wall.tanks[0].y, 288);
});

test('both world boundaries stop movement', () => {
  const game = fixture(() => 300);
  const tank = game.tanks[0];

  tank.x = TANK_RADIUS;
  walk(game, -1);
  assert.equal(tank.x, TANK_RADIUS);
  tank.x = WORLD.width - TANK_RADIUS;
  walk(game, 1);
  assert.equal(tank.x, WORLD.width - TANK_RADIUS);
});

test('walking off a ledge falls under existing gravity and settles', () => {
  const game = fixture((x) => (x < 140 ? 260 : 320));
  const tank = game.tanks[0];

  walk(game, 1, 150);
  assert.equal(tank.grounded, false);
  assert.ok(tank.velocityY > 0);
  walk(game, 0, 180);
  assert.equal(tank.grounded, true);
  assert.ok(Math.abs(tank.y - 308) < 1);
});

test('airborne tanks cannot climb walls and non-aiming phases ignore movement', () => {
  const game = fixture((x) => (x >= 140 ? 240 : 300));
  const tank = game.tanks[0];

  tank.grounded = false;
  walkTank(tank, game.terrain, 1, 1);
  assert.ok(tank.x < 128);
  stepTank(tank, game.terrain, STEP_SECONDS);

  for (const phase of ['flying', 'exploding', 'finished'] as const) {
    game.phase = phase;
    const x = tank.x;

    stepGame(game, STEP_SECONDS, 1);
    assert.equal(tank.x, x);
  }
});
