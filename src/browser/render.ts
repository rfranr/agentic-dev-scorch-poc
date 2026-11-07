import { weaponEffects } from '../simulation/weapons';
import {
  CELL_SIZE,
  GRID_WIDTH,
  EXPLOSION_SECONDS,
  TANK_RADIUS,
  WORLD,
  muzzle,
  type Game,
  type Tank,
  type Terrain,
  type Point,
} from '../simulation/model';

import { drawShotHistory, type Presentation } from './presentation';
import { prepareCamera, type ViewBounds } from './camera';
import { surfaceAt } from '../simulation/terrain';
import { drawAim, drawDistantHills } from './scenery';

const PLAYER_COLORS = ['#65d5ff', '#ff8279'];

const terrainImages = new WeakMap<Terrain, { revision: number; canvas: HTMLCanvasElement }>();

function drawTerrain(context: CanvasRenderingContext2D, terrain: Terrain, view: ViewBounds): void {
  let image = terrainImages.get(terrain);

  if (!image) {
    const canvas = document.createElement('canvas');

    canvas.width = WORLD.width;
    canvas.height = WORLD.height;
    image = { revision: -1, canvas };
    terrainImages.set(terrain, image);
  }

  if (image.revision !== terrain.revision) {
    const buffer = image.canvas.getContext('2d');

    if (buffer) {
      buffer.clearRect(0, 0, WORLD.width, WORLD.height);
      paintTerrain(buffer, terrain);
    }

    image.revision = terrain.revision;
  }

  drawTerrainMargins(context, terrain, view);
  context.drawImage(image.canvas, 0, 0);
}

function drawTerrainMargins(context: CanvasRenderingContext2D, terrain: Terrain, view: ViewBounds): void {
  const bottom = view.y + view.height;
  const leftSurface = surfaceAt(terrain, 0);
  const rightSurface = surfaceAt(terrain, WORLD.width - 1);

  // Overlap the cached bitmap by one world pixel to avoid subpixel camera seams.
  context.fillStyle = '#8b6745';
  context.fillRect(view.x, leftSurface, -view.x + 1, bottom - leftSurface);
  context.fillRect(WORLD.width - 1, rightSurface, view.x + view.width - WORLD.width + 1, bottom - rightSurface);
  context.fillRect(0, WORLD.height - 1, WORLD.width, bottom - WORLD.height + 1);
  context.strokeStyle = '#f2d49a';
  context.lineWidth = CELL_SIZE;
  context.beginPath();
  context.moveTo(view.x, leftSurface + 1);
  context.lineTo(0, leftSurface + 1);
  context.moveTo(WORLD.width, rightSurface + 1);
  context.lineTo(view.x + view.width, rightSurface + 1);
  context.stroke();
}

function paintTerrain(context: CanvasRenderingContext2D, terrain: Terrain): void {
  terrain.cells.forEach((material, index) => {
    if (!material) {
      return;
    }

    const x = (index % GRID_WIDTH) * CELL_SIZE;
    const y = Math.floor(index / GRID_WIDTH) * CELL_SIZE;
    const exposed = !terrain.cells[index - GRID_WIDTH];

    context.fillStyle = exposed ? '#f2d49a' : '#8b6745';
    context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  });
}

function drawTankBody(context: CanvasRenderingContext2D, tank: Tank, color: string): void {
  const barrel = muzzle(tank);

  context.strokeStyle = '#101c28';
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(tank.x, tank.y);
  context.lineTo(barrel.x, barrel.y);
  context.stroke();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.arc(tank.x, tank.y, TANK_RADIUS, Math.PI, 0);
  context.fill();
  context.fillRect(tank.x - TANK_RADIUS, tank.y, TANK_RADIUS * 2, TANK_RADIUS);
  context.strokeStyle = '#101c28';
  context.lineWidth = 2;
  context.strokeRect(tank.x - TANK_RADIUS, tank.y, TANK_RADIUS * 2, TANK_RADIUS);
  context.fillStyle = '#101c28';
  context.fillRect(tank.x - TANK_RADIUS + 2, tank.y + 5, TANK_RADIUS * 2 - 4, 5);
}

function drawTank(context: CanvasRenderingContext2D, tank: Tank, active: boolean, aiming: boolean): void {
  const color = tank.alive ? PLAYER_COLORS[tank.player] : '#59616a';

  // Render at the collision footprint; camera scaling must never change hitboxes.
  context.save();

  if (aiming) {
    drawAim(context, tank);
  }

  drawTankBody(context, tank, color);
  context.fillStyle = color;
  context.font = 'bold 16px system-ui';
  context.textAlign = 'center';
  context.fillText(`P${tank.player + 1} · ${Math.round(tank.health)}`, tank.x, tank.y - 36);
  context.restore();

  if (active && tank.alive) {
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(tank.x, tank.y + TANK_RADIUS + 3, 22, 5, 0, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawShot(context: CanvasRenderingContext2D, game: Game): void {
  const shot = game.projectile;

  if (!shot) {
    return;
  }

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(
    shot.x,
    Math.max(8, shot.y),
    Math.max(4, (2.5 * WORLD.width) / context.canvas.clientWidth),
    0,
    Math.PI * 2,
  );
  context.fill();

  if (shot.y < 0) {
    context.font = `${Math.max(14, (12 * WORLD.width) / context.canvas.clientWidth)}px system-ui`;
    context.textAlign = 'center';
    context.fillText('↑ above view', Math.max(65, Math.min(WORLD.width - 65, shot.x)), 28);
  }
}

function drawExplosion(context: CanvasRenderingContext2D, game: Game): void {
  const explosion = game.explosion;

  if (!explosion) {
    return;
  }

  const progress = Math.min(1, explosion.ageSeconds / EXPLOSION_SECONDS);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blastRadius = weaponEffects(explosion.weapon).blastRadius;
  const radius = reducedMotion ? blastRadius : blastRadius * (0.5 + progress * 0.5);

  context.fillStyle = `rgba(255, 183, 74, ${1 - progress})`;
  traceBlast(context, explosion, radius);
  context.fill();
  context.strokeStyle = `rgba(255, 237, 190, ${1 - progress})`;
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = `rgba(255, 249, 222, ${1 - progress})`;
  traceBlast(context, explosion, radius * 0.35);
  context.fill();
}

function traceBlast(context: CanvasRenderingContext2D, center: Point, radius: number): void {
  context.beginPath();

  for (let corner = 0; corner < 8; corner += 1) {
    const angle = (corner * Math.PI) / 4;
    const x = center.x + Math.round((Math.cos(angle) * radius) / CELL_SIZE) * CELL_SIZE;
    const y = center.y + Math.round((Math.sin(angle) * radius) / CELL_SIZE) * CELL_SIZE;

    if (corner === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
}

export function renderGame(context: CanvasRenderingContext2D, game: Game, presentation: Presentation): void {
  const view = prepareCamera(context);
  const sky = context.createLinearGradient(0, 0, 0, WORLD.height);

  sky.addColorStop(0, '#102438');
  sky.addColorStop(1, '#355769');
  context.fillStyle = sky;
  context.fillRect(view.x, view.y, view.width, view.height);
  drawDistantHills(context, view);
  drawTerrain(context, game.terrain, view);

  drawShotHistory(context, presentation);

  for (const tank of game.tanks) {
    const active = tank.player === game.activePlayer && game.phase !== 'finished';

    drawTank(context, tank, active, active && game.phase === 'aiming');
  }

  drawShot(context, game);
  drawExplosion(context, game);
}
