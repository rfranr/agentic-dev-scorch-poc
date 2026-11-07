import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../src/simulation/game';
import { GRID_WIDTH, STEP_SECONDS, type Tank, type Terrain } from '../src/simulation/model';
import { carveCrater, solidAt, terrainFromSurface } from '../src/simulation/terrain';
import { detachEarth } from '../src/simulation/terrain-connectivity';
import { stepMaterial } from '../src/simulation/material';
import { landingDamage, stepTank } from '../src/simulation/tank-physics';

function countMaterial(terrain: Terrain): number {
  return terrain.cells.reduce((count, cell) => count + Number(cell !== 0), 0);
}

function floatingTank(): Tank {
  return { ...createGame(() => 0.5).tanks[0], x: 400, y: 100, grounded: false };
}

test('circular excavation retains connected roofs and never excavates bedrock', () => {
  const terrain = terrainFromSurface(() => 200);
  const before = countMaterial(terrain);

  carveCrater(terrain, { x: 400, y: 300 });
  assert.equal(solidAt(terrain, 400, 300), false);
  assert.equal(solidAt(terrain, 400, 230), true);
  assert.equal(solidAt(terrain, 500, 300), true);
  assert.ok(countMaterial(terrain) < before);
  carveCrater(terrain, { x: 400, y: 539 });
  assert.equal(solidAt(terrain, 400, 539), true);
});

test('attached ledges remain cohesive; severed islands become conserved falling rubble', () => {
  const terrain = terrainFromSurface(() => 400);
  const island = 100 * GRID_WIDTH + 200;

  terrain.cells[island] = 1;

  for (let row = 101; row < 200; row += 1) {
    terrain.cells[row * GRID_WIDTH + 200] = 1;
  }

  detachEarth(terrain);
  assert.equal(terrain.cells[island], 1);
  terrain.cells[150 * GRID_WIDTH + 200] = 0;
  detachEarth(terrain);
  assert.equal(terrain.cells[island], 2);
  const count = countMaterial(terrain);

  for (let tick = 0; tick < 1200; tick += 1) {
    stepMaterial(terrain, [], STEP_SECONDS);
  }

  assert.equal(countMaterial(terrain), count);
  assert.equal(terrain.cells[island], 0);
  assert.equal(terrain.moving, false);
});

test('rubble routes around tanks without deposition inside their body', () => {
  const terrain = terrainFromSurface(() => 400);
  const tank = { ...floatingTank(), y: 388 };

  terrain.cells[150 * GRID_WIDTH + 200] = 2;
  terrain.moving = true;
  const count = countMaterial(terrain);

  for (let tick = 0; tick < 600; tick += 1) {
    stepMaterial(terrain, [tank], STEP_SECONDS);
  }

  assert.equal(countMaterial(terrain), count);

  for (let y = tank.y - 12; y < tank.y + 12; y += 2) {
    assert.equal(solidAt(terrain, tank.x, y), false);
  }
});

test('support removal causes gradual acceleration, swept landing, and one application of fall damage', () => {
  const terrain = terrainFromSurface(() => 400);
  const tank = floatingTank();
  const startY = tank.y;

  stepTank(tank, terrain, STEP_SECONDS);
  assert.ok(tank.y > startY && tank.y < startY + 1);
  const firstSpeed = tank.velocityY;

  stepTank(tank, terrain, STEP_SECONDS);
  assert.ok(tank.velocityY > firstSpeed);

  for (let tick = 0; tick < 600; tick += 1) {
    stepTank(tank, terrain, STEP_SECONDS);
  }

  assert.ok(tank.y + 12 <= 400);
  assert.ok(tank.y + 13 >= 400);
  assert.ok(tank.health < 100);
  const landedHealth = tank.health;

  stepTank(tank, terrain, 1);
  assert.equal(tank.health, landedHealth);
  assert.equal(tank.velocityY, 0);
});

test('landing policy has safe, damaging and lethal boundaries and catches a one-cell ledge', () => {
  assert.equal(landingDamage(100), 0);
  assert.equal(landingDamage(200), 50);
  assert.equal(landingDamage(300), 100);
  const terrain = terrainFromSurface(() => 538);
  const tank = { ...floatingTank(), y: 350, velocityY: 1000 };

  terrain.cells[200 * GRID_WIDTH + 200] = 1;
  stepTank(tank, terrain, 0.1);
  assert.ok(tank.y + 12 <= 400);
  assert.equal(tank.alive, false);
});

test('turn waits beyond the blast for delayed lethal landing and resolves the winner', () => {
  const game = createGame(() => 0.5);

  game.terrain = terrainFromSurface(() => 500);
  game.tanks[0] = { ...floatingTank(), y: 100 };
  game.tanks[1].y = 488;
  game.phase = 'exploding';
  game.explosion = { x: 600, y: 500, ageSeconds: 0 };

  for (let tick = 0; tick < 60; tick += 1) {
    stepGame(game, STEP_SECONDS);
  }

  assert.equal(game.phase, 'exploding');
  assert.equal(game.activePlayer, 0);

  for (let tick = 0; tick < 600; tick += 1) {
    stepGame(game, STEP_SECONDS);
  }

  assert.equal(game.phase, 'finished');
  assert.equal(game.winner, 1);
});

test('large detached slab settles within ten seconds without material loss', () => {
  const terrain = terrainFromSurface(() => 500);

  for (let row = 50; row < 100; row += 1) {
    terrain.cells.fill(1, row * GRID_WIDTH + 150, row * GRID_WIDTH + 270);
  }

  detachEarth(terrain);
  const count = countMaterial(terrain);
  let tick = 0;

  while (terrain.moving && tick < 1200) {
    stepMaterial(terrain, [], STEP_SECONDS);
    tick += 1;
  }

  assert.ok(tick < 1200, 'collapse must settle within ten seconds');
  assert.equal(countMaterial(terrain), count);
});

test('carving removes support without teleporting a tank', () => {
  const terrain = terrainFromSurface(() => 400);
  const tank = { ...floatingTank(), y: 388, grounded: true };

  carveCrater(terrain, { x: tank.x, y: 400 });
  assert.equal(tank.y, 388);
  stepTank(tank, terrain, STEP_SECONDS);
  assert.ok(tank.y > 388 && tank.y < 389);
  assert.equal(tank.grounded, false);
});

test('identical material fixtures and tick sequences reproduce every cell', () => {
  const first = terrainFromSurface(() => 400);
  const second = terrainFromSurface(() => 400);

  first.cells[100 * GRID_WIDTH + 200] = 2;
  second.cells[100 * GRID_WIDTH + 200] = 2;
  first.moving = true;
  second.moving = true;

  for (let tick = 0; tick < 600; tick += 1) {
    stepMaterial(first, [], STEP_SECONDS);
    stepMaterial(second, [], STEP_SECONDS);
  }

  assert.deepEqual(first, second);
});
