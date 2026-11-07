import { GRID_HEIGHT, GRID_WIDTH, type Terrain } from './model';

// Gameplay strength in normalized cell units, not a physical material constant.
const EARTH_STRENGTH = 8;

interface ColumnRun {
  column: number;
  top: number;
  bottom: number;
  neighbors: number[];
  distance: number;
  mass: number;
}

function collectRuns(terrain: Terrain): ColumnRun[] {
  const runs: ColumnRun[] = [];
  let previous: number[] = [];

  for (let column = 0; column < GRID_WIDTH; column += 1) {
    const current: number[] = [];

    collectColumn(terrain, column, runs, current);
    connectColumns(runs, previous, current);
    previous = current;
  }

  return runs;
}

function collectColumn(terrain: Terrain, column: number, runs: ColumnRun[], current: number[]): void {
  let row = 0;

  while (row < GRID_HEIGHT) {
    if (terrain.cells[row * GRID_WIDTH + column] !== 1) {
      row += 1;
      continue;
    }
    const top = row;

    do {
      row += 1;
    } while (terrain.cells[row * GRID_WIDTH + column] === 1);
    current.push(runs.length);
    runs.push({ column, top, bottom: row - 1, neighbors: [], distance: Infinity, mass: row - top });
  }
}

function connectColumns(runs: ColumnRun[], previous: number[], current: number[]): void {
  let left = 0;
  let right = 0;

  while (left < previous.length && right < current.length) {
    const first = runs[previous[left]];
    const second = runs[current[right]];

    connectOverlappingRuns(runs, previous[left], current[right]);

    if (first.bottom <= second.bottom) {
      left += 1;
    } else {
      right += 1;
    }
  }
}

function connectOverlappingRuns(runs: ColumnRun[], firstIndex: number, secondIndex: number): void {
  const first = runs[firstIndex];
  const second = runs[secondIndex];

  if (first.top <= second.bottom && second.top <= first.bottom) {
    first.neighbors.push(secondIndex);
    second.neighbors.push(firstIndex);
  }
}

function orderFromAnchors(runs: ColumnRun[]): number[] {
  const queue: number[] = [];

  runs.forEach((run, index) => {
    if (run.bottom === GRID_HEIGHT - 1) {
      run.distance = 0;
      queue.push(index);
    }
  });

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const run = runs[queue[cursor]];

    discoverNeighbors(run, runs, queue);
  }

  return queue;
}

function discoverNeighbors(run: ColumnRun, runs: ColumnRun[], queue: number[]): void {
  for (const neighbor of run.neighbors) {
    if (runs[neighbor].distance === Infinity) {
      runs[neighbor].distance = run.distance + 1;
      queue.push(neighbor);
    }
  }
}

function supportThickness(run: ColumnRun, supports: ColumnRun[]): number {
  const intervals = supports
    .map((support) => [Math.max(run.top, support.top), Math.min(run.bottom, support.bottom)])
    .sort((first, second) => first[0] - second[0]);
  let lastRow = -1;
  let thickness = 0;

  for (const [top, bottom] of intervals) {
    thickness += Math.max(0, bottom - Math.max(top, lastRow + 1) + 1);
    lastRow = Math.max(lastRow, bottom);
  }

  return thickness;
}

function routeLoad(run: ColumnRun, runs: ColumnRun[], failed: ColumnRun[]): void {
  const supports = run.neighbors
    .map((neighbor) => runs[neighbor])
    .filter((neighbor) => neighbor.distance === run.distance - 1);
  const thickness = supportThickness(run, supports);

  if (run.mass * run.distance > EARTH_STRENGTH * thickness ** 2) {
    failed.push(run);
  }

  for (const support of supports) {
    support.mass += run.mass / supports.length;
  }
}

function convertRun(terrain: Terrain, run: ColumnRun): void {
  for (let row = run.top; row <= run.bottom; row += 1) {
    terrain.cells[row * GRID_WIDTH + run.column] = 2;
  }
}

// Snapshot evaluation: no conversion affects routing until the next round.
export function failUnsupportedRuns(terrain: Terrain): boolean {
  const runs = collectRuns(terrain);
  const order = orderFromAnchors(runs);
  const failed = runs.filter((run) => run.distance === Infinity);

  for (const index of order.reverse()) {
    const run = runs[index];

    if (run.distance === 0) {
      continue; // Grounded columns have unlimited compressive strength by policy.
    }

    routeLoad(run, runs, failed);
  }
  failed.forEach((run) => convertRun(terrain, run));

  return failed.length > 0;
}
