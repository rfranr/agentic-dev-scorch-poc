import { GRID_HEIGHT, GRID_WIDTH, type Terrain } from './model';

function neighbors(index: number): number[] {
  const column = index % GRID_WIDTH;
  const adjacent = [index - GRID_WIDTH, index + GRID_WIDTH];

  if (column > 0) {
    adjacent.push(index - 1);
  }
  if (column < GRID_WIDTH - 1) {
    adjacent.push(index + 1);
  }

  return adjacent;
}

// Four-connected earth retains attached roofs; loose rubble never re-coheres.
export function detachEarth(terrain: Terrain): void {
  const connected = new Uint8Array(terrain.cells.length);
  const queue: number[] = [];

  for (let column = 0; column < GRID_WIDTH; column += 1) {
    queue.push((GRID_HEIGHT - 1) * GRID_WIDTH + column);
    connected[queue[column]] = 1;
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    visitNeighbors(queue[cursor], terrain, connected, queue);
  }

  terrain.cells.forEach((material, index) => {
    if (material === 1 && !connected[index]) {
      terrain.cells[index] = 2;
    }
  });
  terrain.moving = terrain.cells.includes(2);
}

function visitNeighbors(index: number, terrain: Terrain, connected: Uint8Array, queue: number[]): void {
  for (const neighbor of neighbors(index)) {
    if (terrain.cells[neighbor] === 1 && !connected[neighbor]) {
      connected[neighbor] = 1;
      queue.push(neighbor);
    }
  }
}
