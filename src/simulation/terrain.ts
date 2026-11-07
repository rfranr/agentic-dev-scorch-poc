import {
  BLAST_RADIUS,
  CELL_SIZE,
  GRID_HEIGHT,
  GRID_WIDTH,
  TANK_RADIUS,
  clamp,
  type Point,
  type Tank,
  type Terrain,
} from './model';
import { detachEarth } from './terrain-connectivity';

export function terrainFromSurface(surface: (x: number) => number): Terrain {
  const cells = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

  cells.forEach((_, index) => {
    const row = Math.floor(index / GRID_WIDTH);
    const column = index % GRID_WIDTH;

    if (row * CELL_SIZE >= surface(column * CELL_SIZE)) {
      cells[index] = 1;
    }
  });
  cells.fill(1, (GRID_HEIGHT - 1) * GRID_WIDTH);

  return {
    revision: 0,
    cells,
    materialSeconds: 0,
    materialDistance: 0,
    materialSpeed: 0,
    diagonalDirection: 1,
    moving: false,
  };
}

export function generateTerrain(random: () => number = Math.random): Terrain {
  const phase = random() * Math.PI * 2;
  const secondaryPhase = random() * Math.PI * 2;

  return terrainFromSurface(
    (x) => 540 * 0.73 + Math.sin(x / 145 + phase) * 42 + Math.sin(x / 53 + secondaryPhase) * 15,
  );
}

export function solidAt(terrain: Terrain, x: number, y: number): boolean {
  const column = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);

  return (
    column >= 0 &&
    column < GRID_WIDTH &&
    row >= 0 &&
    row < GRID_HEIGHT &&
    terrain.cells[row * GRID_WIDTH + column] !== 0
  );
}

export function surfaceAt(terrain: Terrain, x: number): number {
  const column = clamp(Math.floor(x / CELL_SIZE), 0, GRID_WIDTH - 1);

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    if (terrain.cells[row * GRID_WIDTH + column]) {
      return row * CELL_SIZE;
    }
  }

  return GRID_HEIGHT * CELL_SIZE;
}

export function carveCrater(terrain: Terrain, impact: Point): void {
  terrain.cells.forEach((_, index) => {
    const row = Math.floor(index / GRID_WIDTH);
    const column = index % GRID_WIDTH;
    const distance = Math.hypot(column * CELL_SIZE + 1 - impact.x, row * CELL_SIZE + 1 - impact.y);

    if (distance <= BLAST_RADIUS) {
      terrain.cells[index] = 0;
    }
  });

  terrain.cells.fill(1, (GRID_HEIGHT - 1) * GRID_WIDTH);
  detachEarth(terrain);
  terrain.revision += 1;
  terrain.materialSeconds = 0;
  terrain.materialSpeed = 0;
  terrain.materialDistance = 0;
}

// Spawn only: gameplay support removal must use swept tank dynamics.
export function settleTank(tank: Tank, terrain: Terrain): void {
  let supportY = GRID_HEIGHT * CELL_SIZE;

  for (let x = tank.x - TANK_RADIUS; x <= tank.x + TANK_RADIUS; x += 1) {
    supportY = Math.min(supportY, surfaceAt(terrain, x));
  }

  tank.y = supportY - TANK_RADIUS;
  tank.velocityY = 0;
  tank.grounded = true;
}
