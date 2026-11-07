import { GRAVITY, TANK_RADIUS, WORLD, clamp, type Tank, type Terrain } from './model';
import { solidAt } from './terrain';

export const WALK_SPEED = 48; // World pixels per second.
const MAX_STEP_HEIGHT = 4; // World pixels; higher ledges are impassable.

export const SAFE_LANDING_SPEED = 100;
export const FALL_DAMAGE_PER_SPEED = 0.5;

export function landingDamage(speed: number): number {
  return clamp((speed - SAFE_LANDING_SPEED) * FALL_DAMAGE_PER_SPEED, 0, 100);
}

function supported(tank: Tank, terrain: Terrain, y: number): boolean {
  for (let x = tank.x - TANK_RADIUS; x <= tank.x + TANK_RADIUS; x += 1) {
    if (solidAt(terrain, x, y + TANK_RADIUS)) {
      return true;
    }
  }

  return false;
}

function bodyBlocked(terrain: Terrain, x: number, y: number): boolean {
  // Match the flat footprint used by support physics; the bottom edge is support, not body.
  for (let offsetX = -TANK_RADIUS; offsetX <= TANK_RADIUS; offsetX += 1) {
    if (columnBlocked(terrain, x + offsetX, y)) {
      return true;
    }
  }

  return false;
}

function columnBlocked(terrain: Terrain, x: number, y: number): boolean {
  for (let offsetY = -TANK_RADIUS; offsetY < TANK_RADIUS; offsetY += 1) {
    if (solidAt(terrain, x, y + offsetY)) {
      return true;
    }
  }

  return false;
}

function tryWalkPosition(tank: Tank, terrain: Terrain, x: number): boolean {
  const stepLimit = tank.grounded ? MAX_STEP_HEIGHT : 0;
  let lift = 0;

  while (lift <= stepLimit && bodyBlocked(terrain, x, tank.y - lift)) {
    lift += 1;
  }

  if (lift > stepLimit) {
    return false;
  }

  tank.x = x;
  tank.y -= lift;

  return true;
}

export function walkTank(tank: Tank, terrain: Terrain, direction: number, seconds: number): boolean {
  if (!tank.alive || !Number.isFinite(direction) || direction === 0) {
    return false;
  }

  const distance = Math.sign(direction) * WALK_SPEED * seconds;
  const samples = Math.max(1, Math.ceil(Math.abs(distance)));
  const originX = tank.x;

  for (let sample = 1; sample <= samples; sample += 1) {
    const x = clamp(originX + (distance * sample) / samples, TANK_RADIUS, WORLD.width - TANK_RADIUS);

    if (!tryWalkPosition(tank, terrain, x)) {
      break;
    }
  }

  return tank.x !== originX;
}

function land(tank: Tank): void {
  tank.health = Math.max(0, tank.health - landingDamage(tank.velocityY));
  tank.alive = tank.alive && tank.health > 0;
  tank.velocityY = 0;
  tank.grounded = true;
}

export function stepTank(tank: Tank, terrain: Terrain, seconds: number): boolean {
  if (supported(tank, terrain, tank.y + 1)) {
    land(tank);

    return false;
  }

  tank.grounded = false;
  tank.velocityY += GRAVITY * seconds;
  const distance = tank.velocityY * seconds;
  const samples = Math.max(1, Math.ceil(distance));
  const originY = tank.y;

  for (let sample = 1; sample <= samples; sample += 1) {
    const nextY = originY + (distance * sample) / samples;

    if (supported(tank, terrain, nextY)) {
      land(tank);

      return true;
    }

    tank.y = nextY;
  }

  return true;
}
