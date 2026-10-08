import type {Conveyor, WorldSnapshot} from "@engine/api/types";

export type ConveyorMotion = Map<string, number[]>;

/** Interpole les positions observées, avec un tick de retard visuel seulement.
 * Les files sont ordonnées de la sortie vers l'entrée. Un élément disparu est
 * ignoré ; le tick d’arrivée est inclus dans le trajet visuel.
 */
export function buildConveyorMotion(previous: WorldSnapshot, current: WorldSnapshot, ongoing?: ConveyorMotion): ConveyorMotion {
  const motion: ConveyorMotion = new Map();
  const sameTick = current.tick === previous.tick;
  if (!sameTick && current.tick !== previous.tick + 1) return motion;
  if (sameTick && current.grid !== previous.grid) return motion;
  const previousBelts = new Map(previous.conveyors.map(belt => [belt.id, belt]));
  for (const belt of current.conveyors) {
    const before = previousBelts.get(belt.id);
    if (!before || before.x !== belt.x || before.y !== belt.y || before.direction !== belt.direction || before.type !== belt.type) continue;
    let cursor = 0;
    const starts = belt.carrying.map(item => {
      while (cursor < before.carrying.length) {
        const candidateIndex = cursor++;
        const candidate = before.carrying[candidateIndex];
        // Un transfert retire la tête de la file ; les éléments restants
        // avancent ou restent immobiles, ils ne reculent jamais.
        if (candidate.type === item.type && candidate.amount >= item.amount && candidate.progress <= item.progress) {
          return sameTick ? ongoing?.get(belt.id)?.[candidateIndex] ?? item.progress : candidate.progress;
        }
      }
      return sameTick ? item.progress : -belt.speed;
    });
    motion.set(belt.id, starts);
  }
  return motion;
}

export function conveyorVisualProgress(belt: Conveyor, index: number, alpha: number, motion?: ConveyorMotion): number {
  const phase = Math.min(1, Math.max(0, alpha));
  let ahead: number | undefined;
  for (let slot = 0; slot <= index; slot++) {
    const end = belt.carrying[slot].progress;
    const start = motion?.get(belt.id)?.[slot] ?? end;
    // Le moteur réserve un tick à l'arrivée (progress = 0). Répartir ce
    // temps sur le trajet évite un arrêt à chaque frontière de case.
    const progress = (start + (end - start) * phase + belt.speed) / (1 + belt.speed);
    ahead = Math.min(ahead === undefined ? 1 : Math.max(0, ahead - 0.35), Math.max(0, progress));
  }
  return ahead ?? 0;
}
