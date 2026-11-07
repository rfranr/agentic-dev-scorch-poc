import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, fire, selectWeapon, stepGame } from '../src/simulation/game';
import { moveProjectile } from '../src/simulation/ballistics';
import { STEP_SECONDS } from '../src/simulation/model';
import { settleTank, solidAt, terrainFromSurface } from '../src/simulation/terrain';
import type { Weapon } from '../src/simulation/weapons';

function impactGame(weapon: Weapon) {
  const game = createGame(() => 0.5);

  game.terrain = terrainFromSurface(() => 400);

  for (const tank of game.tanks) {
    settleTank(tank, game.terrain);
  }
  game.tanks[1].x = 450;
  selectWeapon(game, weapon);
  fire(game);
  game.projectile = { x: 400, y: 399, velocityX: 0, velocityY: 200, weapon };
  stepGame(game, STEP_SECONDS);

  return game;
}

test('selection is aiming-only and firing snapshots the weapon through ballistics', () => {
  const game = createGame(() => 0.5);

  assert.equal(game.selectedWeapon, 'standard');
  selectWeapon(game, 'heavy');
  assert.equal(fire(game), true);
  selectWeapon(game, 'standard');
  assert.equal(game.selectedWeapon, 'heavy');
  assert.equal(moveProjectile(game.projectile!, STEP_SECONDS).weapon, 'heavy');
  game.selectedWeapon = 'standard';
  assert.equal(game.projectile?.weapon, 'heavy');
  assert.equal(createGame().selectedWeapon, 'standard');
});

test('Heavy carves farther and damages tanks outside the Standard radius', () => {
  const standard = impactGame('standard');
  const heavy = impactGame('heavy');

  assert.equal(standard.phase, 'exploding');
  assert.equal(heavy.explosion?.weapon, 'heavy');
  assert.equal(solidAt(standard.terrain, 450, 410), true);
  assert.equal(solidAt(heavy.terrain, 450, 410), false);
  assert.equal(standard.tanks[1].alive, true);
  assert.equal(heavy.tanks[1].alive, false);

  for (let step = 0; step < 2000 && heavy.phase === 'exploding'; step += 1) {
    stepGame(heavy, STEP_SECONDS);
  }
  assert.equal(heavy.phase, 'finished');
  assert.equal(heavy.winner, 0);
});

test('a missed Heavy shot advances the turn and resets selection', () => {
  const game = createGame(() => 0.5);

  selectWeapon(game, 'heavy');
  fire(game);
  game.projectile!.x = -10;
  stepGame(game, STEP_SECONDS);
  assert.equal(game.phase, 'aiming');
  assert.equal(game.activePlayer, 1);
  assert.equal(game.selectedWeapon, 'standard');
  selectWeapon(game, 'heavy');
  assert.equal(game.selectedWeapon, 'heavy');
});
