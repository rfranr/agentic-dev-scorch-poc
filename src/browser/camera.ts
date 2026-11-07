import { WORLD } from '../simulation/model';

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// CSS pixels define the camera; backing pixels are independent of physics.
export function prepareCamera(context: CanvasRenderingContext2D): ViewBounds {
  const canvas = context.canvas;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const top = document.getElementById('health')?.getBoundingClientRect().bottom ?? 80;
  const form = document.getElementById('aim-form');
  const bottom = form?.getClientRects().length ? form.getBoundingClientRect().top : height - 48;
  const availableHeight = Math.max(1, bottom - top - 16);
  const scale = Math.min(width / WORLD.width, availableHeight / WORLD.height);

  const backingWidth = Math.round(width * pixelRatio);
  const backingHeight = Math.round(height * pixelRatio);

  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = '#192638';
  context.fillRect(0, 0, width, height);
  const offsetX = (width - WORLD.width * scale) / 2;
  const offsetY = top + 8 + (availableHeight - WORLD.height * scale) / 2;

  context.translate(offsetX, offsetY);
  context.scale(scale, scale);

  return { x: -offsetX / scale, y: -offsetY / scale, width: width / scale, height: height / scale };
}
