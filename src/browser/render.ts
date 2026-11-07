import { BLAST_RADIUS, EXPLOSION_SECONDS, TANK_RADIUS, WORLD, muzzle, type Game, type Tank } from '../simulation/model';

import { drawShotHistory, type Presentation } from './presentation';
import { drawAim, drawDistantHills, drawSoil } from './scenery';

const PLAYER_COLORS = ['#65d5ff', '#ffbe69'];

function traceTerrain(context: CanvasRenderingContext2D, terrain: number[]): void {
  context.beginPath();
  context.moveTo(0, WORLD.height);

  for (let x = 0; x < terrain.length; x += 1) {
    context.lineTo(x, terrain[x]);
  }

  context.lineTo(WORLD.width, WORLD.height);
  context.closePath();
}

function drawTerrain(context: CanvasRenderingContext2D, terrain: number[]): void {
  traceTerrain(context, terrain);
  const soil = context.createLinearGradient(0, 300, 0, WORLD.height);

  soil.addColorStop(0, '#65774b');
  soil.addColorStop(1, '#293b32');
  context.fillStyle = soil;
  context.fill();
  context.save();
  context.clip();
  drawSoil(context);
  context.restore();
  // Canvas save/restore does not preserve the current path changed by soil strokes.
  traceTerrain(context, terrain);
  context.strokeStyle = '#c5d59b';
  context.lineWidth = 2;
  context.stroke();
}

function drawTankBody(context: CanvasRenderingContext2D, tank: Tank, color: string): void {
  const barrel = muzzle(tank);

  context.strokeStyle = color;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(tank.x, tank.y);
  context.lineTo(barrel.x, barrel.y);
  context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.arc(tank.x, tank.y, TANK_RADIUS, Math.PI, 0);
  context.fill();
  context.fillRect(tank.x - TANK_RADIUS, tank.y, TANK_RADIUS * 2, TANK_RADIUS);
  context.fillStyle = '#101c28';
  context.fillRect(tank.x - TANK_RADIUS + 2, tank.y + 5, TANK_RADIUS * 2 - 4, 5);
}

function drawTank(context: CanvasRenderingContext2D, tank: Tank, active: boolean, aiming: boolean): void {
  const color = tank.alive ? PLAYER_COLORS[tank.player] : '#59616a';

  // Keep visual silhouettes legible on narrow screens without changing hitboxes.
  const displayScale = Math.max(1, 20 / (TANK_RADIUS * 2 * (context.canvas.clientWidth / WORLD.width)));

  context.save();
  context.translate(tank.x, tank.y + TANK_RADIUS);
  context.scale(displayScale, displayScale);
  context.translate(-tank.x, -tank.y - TANK_RADIUS);

  if (aiming) {
    drawAim(context, tank);
  }

  drawTankBody(context, tank, color);
  context.fillStyle = color;
  context.font = 'bold 16px system-ui';
  context.textAlign = 'center';
  context.fillText(`P${tank.player + 1}`, tank.x, tank.y - 36);
  context.restore();

  if (active && tank.alive) {
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(tank.x, tank.y + TANK_RADIUS + 3, 22 * displayScale, 5, 0, 0, Math.PI * 2);
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

  const progress = explosion.ageSeconds / EXPLOSION_SECONDS;

  context.fillStyle = `rgba(255, 183, 74, ${1 - progress})`;
  context.beginPath();
  context.arc(explosion.x, explosion.y, BLAST_RADIUS * (0.5 + progress * 0.5), 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = `rgba(255, 237, 190, ${1 - progress})`;
  context.lineWidth = 4;
  context.stroke();
}

export function renderGame(context: CanvasRenderingContext2D, game: Game, presentation: Presentation): void {
  const sky = context.createLinearGradient(0, 0, 0, WORLD.height);

  sky.addColorStop(0, '#102438');
  sky.addColorStop(1, '#355769');
  context.fillStyle = sky;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  drawDistantHills(context);
  drawTerrain(context, game.terrain);

  drawShotHistory(context, presentation);

  for (const tank of game.tanks) {
    const active = tank.player === game.activePlayer && game.phase !== 'finished';

    drawTank(context, tank, active, active && game.phase === 'aiming');
  }

  drawShot(context, game);
  drawExplosion(context, game);
}
