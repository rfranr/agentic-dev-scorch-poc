import { GRAVITY, TANK_RADIUS, clamp, type Tank, type Terrain } from './model';
import { solidAt } from './terrain';

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
