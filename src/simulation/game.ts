import {
  AIM_LIMITS,
  DAMAGE_RADIUS,
  EXPLOSION_SECONDS,
  TANK_RADIUS,
  WORLD,
  clamp,
  muzzle,
  type Game,
  type Point,
  type Tank,
} from './model';
import { moveProjectile, traceFlight } from './ballistics';
import { carveCrater, generateTerrain, settleTank } from './terrain';
import { stepMaterial, wakeMaterial } from './material';
import { stepTank } from './tank-physics';

const STABLE_INTERVAL_SECONDS = 0.2;
const MAX_RESOLUTION_SECONDS = 10;

export function createGame(random: () => number = Math.random): Game {
  const terrain = generateTerrain(random);
  const tanks = [0.15, 0.85].map((position, player): Tank => {
    const tank = {
      player,
      x: Math.round(WORLD.width * position),
      y: 0,
      direction: player === 0 ? 1 : -1,
      angle: 45,
      power: 360,
      alive: true,
      health: 100,
      velocityY: 0,
      grounded: true,
    };

    settleTank(tank, terrain);

    return tank;
  });

  return {
    terrain,
    stableSeconds: 0,
    resolutionSeconds: 0,
    tanks,
    activePlayer: 0,
    phase: 'aiming',
    projectile: null,
    explosion: null,
    winner: null,
    lastShot: 'Aim toward the other tank, then fire.',
  };
}

export function setAim(game: Game, angle: number, power: number): void {
  if (game.phase !== 'aiming' || !Number.isFinite(angle) || !Number.isFinite(power)) {
    return;
  }

  const tank = game.tanks[game.activePlayer];

  tank.angle = clamp(angle, AIM_LIMITS.minAngle, AIM_LIMITS.maxAngle);
  tank.power = clamp(power, AIM_LIMITS.minPower, AIM_LIMITS.maxPower);
}

export function fire(game: Game): boolean {
  if (game.phase !== 'aiming') {
    return false;
  }

  const tank = game.tanks[game.activePlayer];
  const origin = muzzle(tank);
  const radians = (tank.angle * Math.PI) / 180;

  game.projectile = {
    ...origin,
    velocityX: Math.cos(radians) * tank.power * tank.direction,
    velocityY: -Math.sin(radians) * tank.power,
  };
  game.phase = 'flying';
  game.lastShot = 'Shot in flight…';

  return true;
}

function finishShot(game: Game): void {
  const survivors = game.tanks.filter((tank) => tank.alive);

  game.projectile = null;
  game.explosion = null;

  if (survivors.length < 2) {
    game.phase = 'finished';
    game.winner = survivors[0]?.player ?? null;

    return;
  }

  game.activePlayer = 1 - game.activePlayer;
  game.phase = 'aiming';
}

function explode(game: Game, impact: Point): void {
  game.projectile = null;
  game.explosion = { x: impact.x, y: impact.y, ageSeconds: 0 };
  game.phase = 'exploding';
  game.lastShot = 'Impact — waiting for terrain and tanks to settle.';
  game.stableSeconds = 0;
  game.resolutionSeconds = 0;
  carveCrater(game.terrain, impact);

  // Damage precedes settling: a tank cannot dodge the blast by falling.
  // Both tanks are checked, so self-destruction and a draw are possible.
  for (const tank of game.tanks) {
    const distance = Math.hypot(tank.x - impact.x, tank.y - impact.y);

    tank.alive = tank.alive && distance > DAMAGE_RADIUS + TANK_RADIUS;

    if (!tank.alive) {
      tank.health = 0;
    }
  }
}

function advanceFlight(game: Game, seconds: number): void {
  const projectile = game.projectile;

  if (!projectile) {
    return;
  }

  const next = moveProjectile(projectile, seconds);
  const result = traceFlight(game, projectile, next);

  game.projectile = result.projectile;

  if (result.outcome === 'impact') {
    explode(game, result.projectile);
  }

  if (result.outcome === 'miss') {
    game.lastShot = 'Shot left the battlefield.';
    finishShot(game);
  }
}

function advanceWorld(game: Game, seconds: number): boolean {
  const materialMoved = stepMaterial(game.terrain, game.tanks, seconds);
  const tankMovement = game.tanks.map((tank) => stepTank(tank, game.terrain, seconds));
  const tanksMoved = tankMovement.some(Boolean);
  const moving = materialMoved || tanksMoved;

  // Deposits resting on a tank must wake when that support moves.
  if (tanksMoved) {
    wakeMaterial(game.terrain);
  }

  return moving;
}

function advanceResolution(game: Game, seconds: number): void {
  const moving = advanceWorld(game, seconds);

  game.stableSeconds = moving ? 0 : game.stableSeconds + seconds;
  game.resolutionSeconds += seconds;

  if (game.explosion) {
    game.explosion.ageSeconds += seconds;
  }

  if (game.resolutionSeconds > MAX_RESOLUTION_SECONDS) {
    throw new Error('Shot resolution exceeded 10 seconds; terrain or tank dynamics did not settle.');
  }

  if (game.resolutionSeconds >= EXPLOSION_SECONDS && game.stableSeconds >= STABLE_INTERVAL_SECONDS) {
    game.lastShot = `Settled. P1: ${Math.round(game.tanks[0].health)} HP; P2: ${Math.round(game.tanks[1].health)} HP.`;
    finishShot(game);
  }
}

export function stepGame(game: Game, seconds: number): void {
  if (game.phase === 'flying') {
    advanceFlight(game, seconds);

    return;
  }

  if (game.phase !== 'exploding' || !game.explosion) {
    return;
  }

  advanceResolution(game, seconds);
}
