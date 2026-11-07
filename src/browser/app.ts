import { createGame, fire, setAim, stepGame } from '../simulation/game';
import { STEP_SECONDS, type Game } from '../simulation/model';
import { renderGame } from './render';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);

  if (!found) {
    throw new Error(`Missing game element: ${id}`);
  }

  return found as T;
}

function readControls() {
  return {
    canvas: element<HTMLCanvasElement>('battlefield'),
    form: element<HTMLFormElement>('aim-form'),
    fieldset: element<HTMLFieldSetElement>('aim-controls'),
    angle: element<HTMLInputElement>('angle'),
    power: element<HTMLInputElement>('power'),
    angleValue: element<HTMLOutputElement>('angle-value'),
    powerValue: element<HTMLOutputElement>('power-value'),
    status: element<HTMLParagraphElement>('status'),
    lastShot: element<HTMLParagraphElement>('last-shot'),
    restart: element<HTMLButtonElement>('restart'),
  };
}

type Controls = ReturnType<typeof readControls>;

function statusText(game: Game): string {
  if (game.phase === 'finished') {
    return game.winner === null ? 'Draw — both tanks destroyed.' : `Player ${game.winner + 1} wins!`;
  }

  const player = `Player ${game.activePlayer + 1}`;

  if (game.phase === 'aiming') {
    return `${player}'s turn — aim and fire.`;
  }

  return `${player} fired — resolving shot…`;
}

function syncControls(controls: Controls, game: Game): void {
  const tank = game.tanks[game.activePlayer];

  controls.fieldset.disabled = game.phase !== 'aiming';
  controls.angle.value = String(tank.angle);
  controls.power.value = String(tank.power);
  controls.angleValue.value = `${tank.angle}°`;
  controls.powerValue.value = `${tank.power} px/s`;
  controls.status.textContent = statusText(game);
  controls.status.dataset.phase = game.phase;
  controls.lastShot.textContent = game.lastShot;
}

export function startGame(): void {
  const controls = readControls();
  const context = controls.canvas.getContext('2d');

  if (!context) {
    controls.status.textContent = 'Canvas is unavailable. Please use a browser with Canvas 2D support.';

    return;
  }

  let game = createGame();
  let previousTimestamp = 0;
  let accumulatorSeconds = 0;
  let displayedState = '';
  const updateAim = () => setAim(game, Number(controls.angle.value), Number(controls.power.value));

  controls.angle.addEventListener('input', updateAim);
  controls.power.addEventListener('input', updateAim);
  controls.form.addEventListener('submit', (event) => {
    event.preventDefault();
    fire(game);
  });
  controls.restart.addEventListener('click', () => {
    game = createGame();
    accumulatorSeconds = 0;
    displayedState = '';
  });

  const frame = (timestamp: number): void => {
    // Discard excess time after a background tab pause, rather than jumping a shot.
    const elapsedSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.1);

    previousTimestamp = timestamp;
    accumulatorSeconds += elapsedSeconds;

    while (accumulatorSeconds >= STEP_SECONDS) {
      stepGame(game, STEP_SECONDS);
      accumulatorSeconds -= STEP_SECONDS;
    }

    const tank = game.tanks[game.activePlayer];
    const stateKey = `${game.phase}/${game.activePlayer}/${tank.angle}/${tank.power}`;

    if (stateKey !== displayedState) {
      syncControls(controls, game);
      displayedState = stateKey;
    }

    renderGame(context, game);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
