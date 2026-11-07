import { CELL_SIZE, GRAVITY, GRID_WIDTH, TANK_RADIUS, type Tank, type Terrain } from './model';

const MATERIAL_STEP_SECONDS = 1 / 30;
const MAX_RUBBLE_SPEED = 180; // World pixels per second; limits swept work per fixed tick.

// One disturbance owns a shared gravity clock. Sleeping deposits retain their cells,
// but a new disturbance restarts acceleration rather than inheriting old fall speed.
export function wakeMaterial(terrain: Terrain): void {
  if (!terrain.moving && terrain.cells.includes(2)) {
    terrain.moving = true;
    terrain.materialSeconds = 0;
    terrain.materialSpeed = 0;
    terrain.materialDistance = 0;
  }
}

function blockedByTank(index: number, tanks: Tank[]): boolean {
  const x = (index % GRID_WIDTH) * CELL_SIZE + CELL_SIZE / 2;
  const y = Math.floor(index / GRID_WIDTH) * CELL_SIZE + CELL_SIZE / 2;

  return tanks.some(
    (tank) =>
      Math.abs(tank.x - x) <= TANK_RADIUS + CELL_SIZE / 2 && Math.abs(tank.y - y) <= TANK_RADIUS + CELL_SIZE / 2,
  );
}

function destination(terrain: Terrain, index: number, tanks: Tank[]): number | undefined {
  const column = index % GRID_WIDTH;
  const candidates = [index + GRID_WIDTH];

  for (const offset of [terrain.diagonalDirection, -terrain.diagonalDirection]) {
    if (column + offset >= 0 && column + offset < GRID_WIDTH) {
      candidates.push(index + GRID_WIDTH + offset);
    }
  }

  return candidates.find((target) => terrain.cells[target] === 0 && !blockedByTank(target, tanks));
}

function moveLayer(terrain: Terrain, tanks: Tank[]): boolean {
  let moved = false;

  // Bottom-up traversal ensures each grain moves at most once in this sweep.
  for (let index = terrain.cells.length - GRID_WIDTH - 1; index >= 0; index -= 1) {
    if (terrain.cells[index] !== 2) {
      continue;
    }
    const target = destination(terrain, index, tanks);

    if (target !== undefined) {
      terrain.cells[target] = 2;
      terrain.cells[index] = 0;
      moved = true;
    }
  }

  return moved;
}

export function stepMaterial(terrain: Terrain, tanks: Tank[], seconds: number): boolean {
  if (!terrain.moving) {
    return false;
  }

  terrain.materialSeconds += seconds;

  if (terrain.materialSeconds < MATERIAL_STEP_SECONDS) {
    return true;
  }

  const elapsedSeconds = terrain.materialSeconds;

  terrain.materialSeconds = 0;

  return advanceMaterial(terrain, tanks, elapsedSeconds);
}

function advanceMaterial(terrain: Terrain, tanks: Tank[], seconds: number): boolean {
  terrain.materialSpeed = Math.min(MAX_RUBBLE_SPEED, terrain.materialSpeed + GRAVITY * seconds);
  terrain.materialDistance += terrain.materialSpeed * seconds;
  let moved = false;

  while (terrain.materialDistance >= CELL_SIZE) {
    const layerMoved = moveLayer(terrain, tanks);

    moved = layerMoved || moved;
    terrain.moving = layerMoved;
    terrain.materialDistance -= CELL_SIZE;
    terrain.diagonalDirection *= -1;
  }

  if (moved) {
    terrain.revision += 1;
  }

  return terrain.moving;
}
