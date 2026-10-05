import type {Position} from "@engine/api/types";

export type DestructionParticle = {
  x: number; y: number; vx: number; vy: number; bornAt: number; lifetime: number; size: number; color: string;
};

export function createDestructionParticles(
  cell: Position,
  cellSize: number,
  bornAt: number,
  palette: readonly string[]
): DestructionParticle[] {
  const centerX = cell.x * cellSize + cellSize / 2;
  const centerY = cell.y * cellSize + cellSize / 2;
  return Array.from({length: 10}, (_, index) => {
    const angle = (index / 10) * Math.PI * 2 + Math.random() * 0.35;
    const speed = cellSize * (0.025 + Math.random() * 0.035);
    return {
      x: centerX, y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - cellSize * 0.025,
      bornAt, lifetime: 360 + Math.random() * 220,
      size: Math.max(2, cellSize * (0.07 + Math.random() * 0.05)),
      color: palette[index % palette.length]
    };
  });
}

export function drawDestructionParticles(
  ctx: CanvasRenderingContext2D,
  particles: DestructionParticle[],
  now: number
) {
  ctx.save();
  for (const particle of particles) {
    const age = now - particle.bornAt;
    if (age < 0 || age >= particle.lifetime) continue;
    const progress = age / particle.lifetime;
    const frames = age / 16.67;
    const x = particle.x + particle.vx * frames;
    const y = particle.y + particle.vy * frames + 0.018 * frames * frames;
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = particle.color;
    const size = particle.size * (1 - progress * 0.45);
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.ceil(size), Math.ceil(size));
  }
  ctx.restore();
}
