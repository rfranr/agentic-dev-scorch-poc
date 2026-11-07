import { BLAST_RADIUS, TANK_RADIUS, WORLD, clamp, type Point, type Tank } from './model';

export function generateTerrain(random: () => number = Math.random): number[] {
  const phase = random() * Math.PI * 2;
  const secondaryPhase = random() * Math.PI * 2;

  return Array.from({ length: WORLD.width }, (_, x) => {
    const broadHill = Math.sin(x / 145 + phase) * 42;
    const smallHills = Math.sin(x / 53 + secondaryPhase) * 15;

    return Math.round(WORLD.height * 0.73 + broadHill + smallHills);
  });
}

export function surfaceAt(terrain: number[], x: number): number {
  const column = clamp(Math.round(x), 0, terrain.length - 1);

  return terrain[column];
}

// A heightfield cannot retain overhangs: a blast opens a crater to the sky.
// Never add ground, and retain a thin bedrock layer so tanks stay in the world.
export function carveCrater(terrain: number[], impact: Point): void {
  const start = Math.max(0, Math.ceil(impact.x - BLAST_RADIUS));
  const end = Math.min(terrain.length - 1, Math.floor(impact.x + BLAST_RADIUS));
  const bedrockY = WORLD.height - TANK_RADIUS;

  for (let x = start; x <= end; x += 1) {
    const horizontalDistance = x - impact.x;
    const craterBottom = impact.y + Math.sqrt(BLAST_RADIUS ** 2 - horizontalDistance ** 2);

    terrain[x] = Math.max(terrain[x], Math.min(bedrockY, craterBottom));
  }
}

// Tanks settle instantly onto the highest support across their footprint.
// They do not rise, slide sideways, or take falling damage in this version.
export function settleTank(tank: Tank, terrain: number[]): void {
  const start = Math.max(0, Math.floor(tank.x - TANK_RADIUS));
  const end = Math.min(terrain.length - 1, Math.ceil(tank.x + TANK_RADIUS));
  const supportY = Math.min(...terrain.slice(start, end + 1));

  tank.y = supportY - TANK_RADIUS;
}
