import { TANK_RADIUS, WORLD, type Game, type Point } from '../simulation/model';

// Presentation history belongs to one match; restart creates a fresh instance.
export interface Presentation {
  trail: Point[];
  impact: Point | null;
  outcome: string;
  previousPhase: Game['phase'];
}

export function createPresentation(): Presentation {
  return { trail: [], impact: null, outcome: '', previousPhase: 'aiming' };
}

export function updatePresentation(presentation: Presentation, game: Game): void {
  if (game.phase === 'flying' && presentation.previousPhase !== 'flying') {
    presentation.trail = [];
    presentation.impact = null;
    presentation.outcome = '';
  }

  if (game.projectile) {
    presentation.trail.push({ x: game.projectile.x, y: game.projectile.y });
    presentation.trail = presentation.trail.slice(-24);
  }

  if (game.explosion && presentation.previousPhase !== 'exploding') {
    presentation.impact = { x: game.explosion.x, y: game.explosion.y };
    presentation.outcome = describeImpact(game, game.explosion);
  }

  presentation.previousPhase = game.phase;
}

function describeImpact(game: Game, impact: Point): string {
  const opponent = game.tanks[1 - game.activePlayer];
  const shooter = game.tanks[game.activePlayer];

  if (!opponent.alive) {
    return `P${opponent.player + 1} DESTROYED`;
  }

  if (!shooter.alive) {
    return 'SELF HIT';
  }

  const distancePastOpponent = (impact.x - opponent.x) * shooter.direction;

  if (Math.abs(distancePastOpponent) < TANK_RADIUS * 2) {
    return 'ALIGNED — CHECK HEIGHT';
  }

  return distancePastOpponent < 0 ? 'SHORT OF TARGET' : 'PAST TARGET';
}

export function drawShotHistory(context: CanvasRenderingContext2D, presentation: Presentation): void {
  context.strokeStyle = '#d7eeff';
  context.lineWidth = 3;
  context.beginPath();

  for (const point of presentation.trail) {
    context.lineTo(point.x, Math.max(6, point.y));
  }

  context.stroke();
  drawImpact(context, presentation);
}

function drawImpact(context: CanvasRenderingContext2D, presentation: Presentation): void {
  if (!presentation.impact) {
    return;
  }

  const { x, y } = presentation.impact;

  context.strokeStyle = '#ffdf99';
  context.beginPath();
  context.moveTo(x - 9, y - 9);
  context.lineTo(x + 9, y + 9);
  context.moveTo(x + 9, y - 9);
  context.lineTo(x - 9, y + 9);
  context.stroke();
  context.fillStyle = '#fff1ce';
  context.font = 'bold 15px system-ui';
  context.textAlign = 'center';
  context.fillText('IMPACT', Math.max(42, Math.min(WORLD.width - 42, x)), y - 18);
  context.fillStyle = '#101923e8';
  context.fillRect(180, 18, WORLD.width - 360, 40);
  context.fillStyle = '#fff1ce';
  context.font = `bold ${Math.max(22, (12 * WORLD.width) / context.canvas.clientWidth)}px system-ui`;
  context.fillText(presentation.outcome, WORLD.width / 2, 45);
}
