import { setAim, fire } from '../simulation/game';
import type { Game } from '../simulation/model';

// Input always reads the current match and tank, including after restart or turn changes.
export function bindArcadeInput(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  currentGame: () => Game,
  restart: () => void,
): void {
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const point = new DOMPoint(
      ((event.clientX - bounds.left) * canvas.width) / bounds.width,
      ((event.clientY - bounds.top) * canvas.height) / bounds.height,
    ).matrixTransform(context.getTransform().inverse());
    const game = currentGame();
    const tank = game.tanks[game.activePlayer];
    const angle = (Math.atan2(tank.y - point.y, (point.x - tank.x) * tank.direction) * 180) / Math.PI;

    setAim(game, angle, tank.power);
  });
  canvas.addEventListener('click', (event) => {
    if (event.button === 0 && event.pointerType === 'mouse') {
      fire(currentGame());
    }
  });
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const game = currentGame();
      const tank = game.tanks[game.activePlayer];

      setAim(game, tank.angle, tank.power - Math.sign(event.deltaY) * 5);
    },
    { passive: false },
  );
  window.addEventListener('keydown', (event) => {
    if (ownsKeyboardInput(event)) {
      return;
    }

    handleKey(event, currentGame(), restart);
  });
}

function ownsKeyboardInput(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() === 'r' || !(event.target instanceof HTMLElement)) {
    return false;
  }

  return (
    Boolean(event.target.closest('input')) ||
    (event.code === 'Space' && Boolean(event.target.closest('button, summary')))
  );
}

function handleKey(event: KeyboardEvent, game: Game, restart: () => void): void {
  const tank = game.tanks[game.activePlayer];
  const adjustments: Record<string, [number, number]> = {
    ArrowLeft: [tank.direction, 0],
    ArrowRight: [-tank.direction, 0],
    ArrowUp: [0, 5],
    ArrowDown: [0, -5],
  };
  const adjustment = adjustments[event.key];

  if (adjustment) {
    event.preventDefault();
    setAim(game, tank.angle + adjustment[0], tank.power + adjustment[1]);

    return;
  }

  handleActionKey(event, game, restart);
}

function handleActionKey(event: KeyboardEvent, game: Game, restart: () => void): void {
  if (event.code === 'Space') {
    event.preventDefault();

    if (!event.repeat) {
      fire(game);
    }
  } else if (event.key.toLowerCase() === 'r' && !event.repeat) {
    restart();
  }
}
