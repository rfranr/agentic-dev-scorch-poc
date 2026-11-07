import { AIM_LIMITS, BARREL_LENGTH, WORLD, muzzle, type Tank } from '../simulation/model';

export function drawSoil(context: CanvasRenderingContext2D): void {
  context.strokeStyle = '#a4ae7c25';
  context.lineWidth = 2;

  for (let y = 330; y < WORLD.height; y += 26) {
    context.beginPath();
    context.moveTo(0, y);

    for (let x = 0; x <= WORLD.width; x += 16) {
      context.lineTo(x, y + Math.sin(x / 65) * 8);
    }

    context.stroke();
  }
}

export function drawDistantHills(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#53728245';
  context.beginPath();
  context.moveTo(0, WORLD.height);

  for (let x = 0; x <= WORLD.width; x += 8) {
    context.lineTo(x, 310 + Math.sin(x / 170) * 28 + Math.cos(x / 79) * 12);
  }

  context.lineTo(WORLD.width, WORLD.height);
  context.fill();
}

export function drawAim(context: CanvasRenderingContext2D, tank: Tank): void {
  const barrel = muzzle(tank);
  const directionX = (barrel.x - tank.x) / BARREL_LENGTH;
  const directionY = (barrel.y - tank.y) / BARREL_LENGTH;
  const cueLength = 50 + (tank.power / AIM_LIMITS.maxPower) * 60;

  context.save();
  context.strokeStyle = '#ffffffaa';
  context.lineWidth = 2;
  context.setLineDash([5, 7]);
  context.beginPath();
  context.moveTo(barrel.x, barrel.y);
  context.lineTo(tank.x + directionX * cueLength, tank.y + directionY * cueLength);
  context.stroke();
  context.restore();
}
