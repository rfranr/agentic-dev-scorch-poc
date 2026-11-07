import { type Terrain } from './model';
import { failUnsupportedRuns } from './terrain-support';

// Callers own revision invalidation and gravity-clock resets after earth edits.
export function detachEarth(terrain: Terrain): void {
  // Every changing round removes earth, so full relaxation always terminates.
  while (failUnsupportedRuns(terrain)) {
    // Rebuild connectivity and loads from the surviving earth snapshot.
  }
  terrain.moving = terrain.cells.includes(2);
}
