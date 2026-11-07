import { GRAVITY, TANK_RADIUS, WORLD, type Game, type Point, type Projectile } from './model';
import { surfaceAt } from './terrain';

export function moveProjectile(projectile: Projectile, seconds: number): Projectile {
  return {
    x: projectile.x + projectile.velocityX * seconds,
    y: projectile.y + projectile.velocityY * seconds + (GRAVITY * seconds ** 2) / 2,
    velocityX: projectile.velocityX,
    velocityY: projectile.velocityY + GRAVITY * seconds,
  };
}

export function outsideWorld(point: Point): boolean {
  // Allow high arcs above the visible sky; gravity will bring them back.
  return point.x < 0 || point.x >= WORLD.width || point.y >= WORLD.height;
}

export function collides(game: Game, point: Point): boolean {
  const hitsTank = game.tanks.some(
    (tank) => tank.alive && Math.hypot(point.x - tank.x, point.y - tank.y) <= TANK_RADIUS,
  );

  return hitsTank || point.y >= surfaceAt(game.terrain, point.x);
}

export interface FlightResult {
  projectile: Projectile;
  outcome: 'flying' | 'impact' | 'miss';
}

// Sample the swept path at <= 1 world pixel to prevent tunneling through tanks
// or terrain. The caller advances on fixed, small simulation time steps.
export function traceFlight(game: Game, from: Projectile, to: Projectile): FlightResult {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const samples = Math.max(1, Math.ceil(distance));

  for (let index = 1; index <= samples; index += 1) {
    const fraction = index / samples;
    const projectile = {
      ...to,
      x: from.x + (to.x - from.x) * fraction,
      y: from.y + (to.y - from.y) * fraction,
    };

    if (outsideWorld(projectile)) {
      return { projectile, outcome: 'miss' };
    }

    if (collides(game, projectile)) {
      return { projectile, outcome: 'impact' };
    }
  }

  return { projectile: to, outcome: 'flying' };
}
