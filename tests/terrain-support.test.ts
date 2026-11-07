import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRID_HEIGHT, GRID_WIDTH, type Terrain } from '../src/simulation/model';
import { terrainFromSurface } from '../src/simulation/terrain';
import { detachEarth } from '../src/simulation/terrain-connectivity';
import { failUnsupportedRuns } from '../src/simulation/terrain-support';

function rectangle(terrain: Terrain, left: number, right: number, [top, bottom]: [number, number]): void {
  for (let row = top; row <= bottom; row += 1) {
    terrain.cells.fill(1, row * GRID_WIDTH + left, row * GRID_WIDTH + right + 1);
  }
}

function bridge(thickness: number, secondAbutment = true): Terrain {
  const terrain = terrainFromSurface(() => 538);

  rectangle(terrain, 100, 100, [200, GRID_HEIGHT - 1]);
  rectangle(terrain, 101, 110, [200, 199 + thickness]);

  if (secondAbutment) {
    rectangle(terrain, 111, 111, [200, GRID_HEIGHT - 1]);
  }

  return terrain;
}

function cell(terrain: Terrain, column: number, row = 200): number {
  return terrain.cells[row * GRID_WIDTH + column];
}

test('two-cell crown survives while a ten-column thin bridge fails without material loss', () => {
  const thick = bridge(2);
  const thin = bridge(1);
  const before = thin.cells.filter((material) => material !== 0).length;

  detachEarth(thick);
  detachEarth(thin);
  assert.equal(thick.cells.includes(2), false);
  assert.equal(cell(thin, 103), 2);
  assert.equal(thin.cells.filter((material) => material !== 0).length, before);
  assert.equal(cell(thin, 100, GRID_HEIGHT - 1), 1);
});

test('stepped haunches and a two-cell crown form a stable arch', () => {
  const terrain = bridge(2);

  rectangle(terrain, 101, 102, [202, 205]);
  rectangle(terrain, 103, 103, [202, 203]);
  rectangle(terrain, 108, 108, [202, 203]);
  rectangle(terrain, 109, 110, [202, 205]);
  const before = terrain.cells.slice();

  detachEarth(terrain);
  assert.deepEqual(terrain.cells, before);
  assert.equal(terrain.moving, false);
});

test('tip surcharge breaks an otherwise stable cantilever neck', () => {
  const terrain = bridge(1, false);

  terrain.cells.fill(0, 200 * GRID_WIDTH + 104, 200 * GRID_WIDTH + 111);
  detachEarth(terrain);
  assert.equal(cell(terrain, 101), 1);
  rectangle(terrain, 103, 103, [194, 199]);
  detachEarth(terrain);
  assert.equal(cell(terrain, 101), 2);
  assert.equal(cell(terrain, 103, 194), 2);
});

test('equality survives but an extra supported cell exceeds capacity', () => {
  const terrain = bridge(1, false);

  terrain.cells.fill(0, 200 * GRID_WIDTH + 102, 200 * GRID_WIDTH + 111);
  rectangle(terrain, 101, 101, [193, 200]);
  detachEarth(terrain);
  assert.equal(cell(terrain, 101), 1);
  rectangle(terrain, 101, 101, [192, 192]);
  detachEarth(terrain);
  assert.equal(cell(terrain, 101), 2);
});

test('support removal relaxes through multiple snapshots deterministically and idempotently', () => {
  const terrain = bridge(2);

  detachEarth(terrain);

  for (let row = 202; row < GRID_HEIGHT - 1; row += 1) {
    terrain.cells[row * GRID_WIDTH + 111] = 0;
  }
  const duplicate = { ...terrain, cells: terrain.cells.slice() };

  assert.equal(failUnsupportedRuns(terrain), true);
  assert.equal(failUnsupportedRuns(terrain), true);
  detachEarth(terrain);
  detachEarth(duplicate);
  assert.deepEqual(terrain.cells, duplicate.cells);
  const settled = terrain.cells.slice();

  detachEarth(terrain);
  assert.deepEqual(terrain.cells, settled);
  assert.equal(terrain.moving, true);
});

test('diagonal contact and rubble cannot provide cohesive support', () => {
  const terrain = bridge(1, false);

  terrain.cells.fill(0, 200 * GRID_WIDTH + 101, 200 * GRID_WIDTH + 111);
  terrain.cells[199 * GRID_WIDTH + 101] = 1;
  terrain.cells[200 * GRID_WIDTH + 101] = 2;
  detachEarth(terrain);
  assert.equal(cell(terrain, 101, 199), 2);
  assert.equal(cell(terrain, 101), 2);
});
