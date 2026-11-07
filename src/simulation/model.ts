export const WORLD = { width: 960, height: 540 };
export const TANK_RADIUS = 12;
export const BARREL_LENGTH = 25;
export const GRAVITY = 200; // World pixels per second squared; positive y points down.
export const STEP_SECONDS = 1 / 120;
export const BLAST_RADIUS = 42;
export const DAMAGE_RADIUS = 32;
export const EXPLOSION_SECONDS = 0.45;
export const AIM_LIMITS = { minAngle: 5, maxAngle: 175, minPower: 80, maxPower: 520 };

export interface Point {
  x: number;
  y: number;
}

export interface Tank extends Point {
  player: number;
  direction: number;
  angle: number; // Degrees above the inward-facing horizontal.
  power: number; // Launch speed in world pixels per second.
  alive: boolean;
  health: number;
  velocityY: number;
  grounded: boolean;
}

export interface Projectile extends Point {
  velocityX: number;
  velocityY: number;
}

export interface Explosion extends Point {
  ageSeconds: number;
}

export const CELL_SIZE = 2;
export const GRID_WIDTH = WORLD.width / CELL_SIZE;
export const GRID_HEIGHT = WORLD.height / CELL_SIZE;

export interface Terrain {
  revision: number;
  cells: Uint8Array; // 0 air, 1 cohesive earth, 2 loose rubble.
  materialSeconds: number;
  materialDistance: number;
  materialSpeed: number;
  diagonalDirection: number;
  moving: boolean;
}

// One match owns all mutable state. Restart replaces it, including terrain and aim.
export interface Game {
  terrain: Terrain;
  stableSeconds: number;
  resolutionSeconds: number;
  tanks: Tank[];
  activePlayer: number;
  phase: 'aiming' | 'flying' | 'exploding' | 'finished';
  projectile: Projectile | null;
  explosion: Explosion | null;
  winner: number | null; // Null in a finished match means mutual destruction.
  lastShot: string;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function muzzle(tank: Tank): Point {
  const radians = (tank.angle * Math.PI) / 180;

  return {
    x: tank.x + Math.cos(radians) * BARREL_LENGTH * tank.direction,
    y: tank.y - Math.sin(radians) * BARREL_LENGTH,
  };
}
