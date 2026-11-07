import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collides, moveProjectile, outsideWorld, traceFlight } from '../src/simulation/ballistics';
import { createGame, fire, setAim, stepGame } from '../src/simulation/game';
import {
  AIM_LIMITS,
  BLAST_RADIUS,
  EXPLOSION_SECONDS,
  GRAVITY,
  STEP_SECONDS,
  TANK_RADIUS,
  WORLD,
  muzzle,
  type Game,
} from '../src/simulation/model';
import {
  carveCrater,
  generateTerrain,
  settleTank,
  surfaceAt,
  solidAt,
  terrainFromSurface,
} from '../src/simulation/terrain';

function flatGame(): Game {
  const game = createGame(() => 0.5);

  game.terrain = terrainFromSurface(() => 400);

  for (const tank of game.tanks) {
    settleTank(tank, game.terrain);
  }

  return game;
}

function resolveShot(game: Game): void {
  for (let step = 0; step < 4000 && ['flying', 'exploding'].includes(game.phase); step += 1) {
    stepGame(game, STEP_SECONDS);
  }

  assert.ok(['aiming', 'finished'].includes(game.phase), 'shot must resolve in bounded simulation time');
}

function dropAt(game: Game, x: number): void {
  game.phase = 'flying';
  game.projectile = { x, y: 399, velocityX: 0, velocityY: 200 };
  stepGame(game, STEP_SECONDS);
}

test('new match generates reproducible, uneven terrain with two supported tanks', () => {
  const game = createGame(() => 0.25);

  assert.deepEqual(
    game.terrain,
    generateTerrain(() => 0.25),
  );
  assert.equal(game.terrain.cells.length, (WORLD.width * WORLD.height) / 4);
  assert.ok(new Set(Array.from({ length: WORLD.width }, (_, x) => surfaceAt(game.terrain, x))).size > 20);
  assert.equal(game.activePlayer, 0);
  assert.equal(game.phase, 'aiming');
  assert.equal(game.tanks.length, 2);
  assert.notEqual(game.tanks[0].x, game.tanks[1].x);

  for (const tank of game.tanks) {
    const start = tank.x - TANK_RADIUS;
    const support = Math.min(
      ...Array.from({ length: TANK_RADIUS * 2 + 1 }, (_, index) => surfaceAt(game.terrain, start + index)),
    );

    assert.equal(tank.y + TANK_RADIUS, support);
    assert.equal(tank.alive, true);
  }
});

test('terrain changes with a different random source', () => {
  assert.notDeepEqual(
    generateTerrain(() => 0.1),
    generateTerrain(() => 0.7),
  );
});

test('projectile movement follows gravity with time in seconds', () => {
  const projectile = { x: 10, y: 100, velocityX: 80, velocityY: -90 };
  const moved = moveProjectile(projectile, 0.5);

  assert.equal(moved.x, 50);
  assert.equal(moved.y, 100 - 45 + (GRAVITY * 0.5 ** 2) / 2);
  assert.equal(moved.velocityY, -90 + GRAVITY * 0.5);
  assert.equal(projectile.y, 100, 'calculation does not mutate its input');
  assert.deepEqual(moveProjectile(projectile, 0), projectile);
});

test('ballistic integration is consistent across smaller time steps', () => {
  const projectile = { x: 10, y: 100, velocityX: 80, velocityY: -90 };
  const oneStep = moveProjectile(projectile, 1);
  const twoSteps = moveProjectile(moveProjectile(projectile, 0.5), 0.5);

  assert.deepEqual(oneStep, twoSteps);
});

test('aim is bounded and rejects non-finite values', () => {
  const game = flatGame();

  setAim(game, -100, 9999);
  assert.equal(game.tanks[0].angle, AIM_LIMITS.minAngle);
  assert.equal(game.tanks[0].power, AIM_LIMITS.maxPower);
  setAim(game, 999, -10);
  assert.equal(game.tanks[0].angle, AIM_LIMITS.maxAngle);
  assert.equal(game.tanks[0].power, AIM_LIMITS.minPower);
  setAim(game, NaN, Infinity);
  assert.equal(game.tanks[0].angle, AIM_LIMITS.maxAngle);
  assert.equal(game.tanks[0].power, AIM_LIMITS.minPower);
});

test('fire starts at the muzzle and rejects a second shot and mid-flight aim changes', () => {
  const game = flatGame();
  const origin = muzzle(game.tanks[0]);

  assert.equal(fire(game), true);
  assert.equal(game.phase, 'flying');
  assert.equal(game.projectile?.x, origin.x);
  assert.equal(game.projectile?.y, origin.y);
  assert.ok(game.projectile!.velocityX > 0);
  assert.ok(game.projectile!.velocityY < 0);
  assert.equal(fire(game), false);
  setAim(game, 10, 80);
  assert.equal(game.tanks[0].angle, 45);
});

test('second player fires leftward with independent aim settings', () => {
  const game = flatGame();

  setAim(game, 30, 200);
  game.activePlayer = 1;
  setAim(game, 60, 300);
  fire(game);
  assert.ok(game.projectile!.velocityX < 0);
  assert.ok(game.projectile!.velocityY < 0);
  assert.equal(game.tanks[0].angle, 30);
  assert.equal(game.tanks[1].angle, 60);
});

test('collision detects terrain and live tanks but not empty sky or wrecks', () => {
  const game = flatGame();
  const tank = game.tanks[1];

  assert.equal(collides(game, { x: 500, y: 400 }), true);
  assert.equal(collides(game, { x: 500, y: 399 }), false);
  assert.equal(collides(game, { x: tank.x, y: tank.y }), true);
  tank.alive = false;
  assert.equal(collides(game, { x: tank.x, y: tank.y }), false);
});

test('swept collision catches a tank even when a projectile crosses it in one step', () => {
  const game = flatGame();
  const target = game.tanks[1];
  const from = { x: target.x - 100, y: target.y, velocityX: 1000, velocityY: 0 };
  const result = traceFlight(game, from, { ...from, x: target.x + 100 });

  assert.equal(result.outcome, 'impact');
  assert.ok(result.projectile.x <= target.x - TANK_RADIUS + 1);
});

test('swept collision catches a narrow terrain column', () => {
  const game = flatGame();
  const from = { x: 400, y: 300, velocityX: 1000, velocityY: 0 };

  game.terrain = terrainFromSurface((x) => (x === 450 ? 290 : 400));
  assert.equal(traceFlight(game, from, { ...from, x: 500 }).outcome, 'impact');
});

test('world exits include side and bottom boundaries, while high arcs remain live', () => {
  assert.equal(outsideWorld({ x: -1, y: 20 }), true);
  assert.equal(outsideWorld({ x: WORLD.width, y: 20 }), true);
  assert.equal(outsideWorld({ x: 20, y: WORLD.height }), true);
  assert.equal(outsideWorld({ x: 20, y: -100 }), false);
});

test('crater removes ground inside the blast radius without changing distant columns', () => {
  const terrain = terrainFromSurface(() => 400);

  carveCrater(terrain, { x: 400, y: 400 });
  assert.equal(surfaceAt(terrain, 400), 400 + BLAST_RADIUS);
  assert.equal(surfaceAt(terrain, 400 - BLAST_RADIUS - 2), 400);
  assert.equal(surfaceAt(terrain, 400 + BLAST_RADIUS + 2), 400);
  const firstCrater = terrain.cells.slice();

  carveCrater(terrain, { x: 410, y: 390 });
  assert.ok(
    terrain.cells.every((material, index) => !material || firstCrater[index] !== 0),
    'blasts never restore ground',
  );
});

test('craters at world edges stay finite and respect bedrock', () => {
  const terrain = terrainFromSurface(() => WORLD.height - 15);

  carveCrater(terrain, { x: 0, y: WORLD.height - 10 });
  carveCrater(terrain, { x: WORLD.width - 1, y: WORLD.height - 10 });
  assert.equal(terrain.cells.length, (WORLD.width * WORLD.height) / 4);
  assert.ok(terrain.cells.every(Number.isFinite));
  assert.ok(Array.from({ length: WORLD.width }, (_, x) => solidAt(terrain, x, WORLD.height - 1)).every(Boolean));
});

test('spawn placement finds remaining support without changing tank health', () => {
  const game = flatGame();
  const tank = game.tanks[0];
  const originalY = tank.y;

  carveCrater(game.terrain, { x: tank.x, y: 400 });
  settleTank(tank, game.terrain);
  assert.ok(tank.y > originalY);
  assert.ok(tank.y + TANK_RADIUS <= WORLD.height);
  assert.equal(tank.y + TANK_RADIUS, surfaceAt(game.terrain, tank.x - TANK_RADIUS));
});

test('terrain impact persists, holds the turn during the explosion, then alternates once', () => {
  const game = flatGame();

  dropAt(game, 500);
  assert.equal(game.phase, 'exploding');
  assert.equal(game.projectile, null);
  assert.ok(surfaceAt(game.terrain, 500) > 400);
  assert.equal(game.activePlayer, 0);
  assert.equal(fire(game), false);
  const changedTerrain = game.terrain.cells.slice();

  stepGame(game, EXPLOSION_SECONDS);
  assert.equal(game.phase, 'aiming');
  assert.equal(game.activePlayer, 1);
  stepGame(game, 1);
  assert.equal(game.activePlayer, 1);
  assert.deepEqual(game.terrain.cells, changedTerrain);
});

test('a missed shot changes turns without an explosion or terrain mutation', () => {
  const game = flatGame();
  const original = game.terrain.cells.slice();

  game.phase = 'flying';
  game.projectile = { x: WORLD.width - 1, y: 100, velocityX: 300, velocityY: 0 };
  stepGame(game, STEP_SECONDS);
  assert.equal(game.phase, 'aiming');
  assert.equal(game.activePlayer, 1);
  assert.equal(game.explosion, null);
  assert.deepEqual(game.terrain.cells, original);
});

test('direct tank hit destroys the target, creates a crater, and ends the game', () => {
  const game = flatGame();
  const target = game.tanks[1];

  game.phase = 'flying';
  game.projectile = { x: target.x - 40, y: target.y, velocityX: 400, velocityY: 0 };
  resolveShot(game);
  assert.equal(target.alive, false);
  assert.ok(surfaceAt(game.terrain, target.x) > 400);
  assert.equal(game.phase, 'finished');
  assert.equal(game.winner, 0);
  assert.equal(game.activePlayer, 0);
  assert.equal(fire(game), false);
});

test('nearby terrain blast destroys a tank without a direct projectile hit', () => {
  const game = flatGame();

  dropAt(game, game.tanks[1].x + 30);
  assert.equal(game.tanks[1].alive, false);
  resolveShot(game);
  assert.equal(game.winner, 0);
});

test('a distant blast spares both tanks', () => {
  const game = flatGame();

  dropAt(game, game.tanks[1].x + 60);
  resolveShot(game);
  assert.ok(game.tanks.every((tank) => tank.alive));
  assert.equal(game.phase, 'aiming');
});

test('self-destruction awards the opponent the win', () => {
  const game = flatGame();

  dropAt(game, game.tanks[0].x + 30);
  resolveShot(game);
  assert.equal(game.phase, 'finished');
  assert.equal(game.winner, 1);
});

test('simultaneous destruction is a draw and cannot resume firing', () => {
  const game = flatGame();

  game.tanks[1].x = game.tanks[0].x + 20;
  dropAt(game, game.tanks[0].x + 10);
  resolveShot(game);
  assert.equal(game.phase, 'finished');
  assert.equal(game.winner, null);
  assert.ok(game.tanks.every((tank) => !tank.alive));
  assert.equal(fire(game), false);
});

test('ordinary shots resolve and turns alternate in both directions', () => {
  const game = flatGame();

  setAim(game, 60, 180);
  fire(game);
  resolveShot(game);
  assert.equal(game.activePlayer, 1);
  setAim(game, 60, 180);
  fire(game);
  resolveShot(game);
  assert.equal(game.activePlayer, 0);
});

test('a fresh match resets terrain, players, aim, and shot state independently', () => {
  const previous = flatGame();

  dropAt(previous, 500);
  const fresh = createGame(() => 0.7);

  assert.notDeepEqual(fresh.terrain, previous.terrain);
  assert.notEqual(fresh.terrain, previous.terrain);
  assert.equal(fresh.phase, 'aiming');
  assert.equal(fresh.activePlayer, 0);
  assert.equal(fresh.projectile, null);
  assert.equal(fresh.explosion, null);
  assert.equal(fresh.winner, null);
  assert.ok(fresh.tanks.every((tank) => tank.alive && tank.angle === 45 && tank.power === 360));
});
