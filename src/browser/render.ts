import { BLAST_RADIUS, EXPLOSION_SECONDS, TANK_RADIUS, WORLD, muzzle, type Game, type Tank } from '../simulation/model';

const PLAYER_COLORS = ['#65d5ff', '#ffbe69'];

function drawTerrain(context: CanvasRenderingContext2D, terrain: number[]): void {
  context.beginPath();
  context.moveTo(0, WORLD.height);

  for (let x = 0; x < terrain.length; x += 1) {
    context.lineTo(x, terrain[x]);
  }

  context.lineTo(WORLD.width, WORLD.height);
  context.closePath();
  context.fillStyle = '#475b3b';
  context.fill();
  context.strokeStyle = '#b9c88e';
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

function drawTank(context: CanvasRenderingContext2D, tank: Tank, active: boolean): void {
  const color = tank.alive ? PLAYER_COLORS[tank.player] : '#59616a';

  drawTankBody(context, tank, color);
  context.fillStyle = color;
  context.font = 'bold 16px system-ui';
  context.textAlign = 'center';
  context.fillText(`P${tank.player + 1}`, tank.x, tank.y - 36);

  if (active && tank.alive) {
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.strokeRect(tank.x - 18, tank.y - 19, 36, 35);
  }
}

function drawShot(context: CanvasRenderingContext2D, game: Game): void {
  const shot = game.projectile;

  if (!shot) {
    return;
  }

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(shot.x, Math.max(8, shot.y), 4, 0, Math.PI * 2);
  context.fill();

  if (shot.y < 0) {
    context.font = '14px system-ui';
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
}

export function renderGame(context: CanvasRenderingContext2D, game: Game): void {
  const sky = context.createLinearGradient(0, 0, 0, WORLD.height);

  sky.addColorStop(0, '#102438');
  sky.addColorStop(1, '#355769');
  context.fillStyle = sky;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  drawTerrain(context, game.terrain);

  for (const tank of game.tanks) {
    drawTank(context, tank, tank.player === game.activePlayer && game.phase !== 'finished');
  }

  drawShot(context, game);
  drawExplosion(context, game);
}
