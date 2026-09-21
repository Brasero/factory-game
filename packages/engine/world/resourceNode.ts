import type {ResourceNode} from "@engine/models/ResourceNode.ts";
import type {LevelDefinition} from "@engine/models/LevelDefinition.ts";

export function extractResourceNodeFromLevel(level: LevelDefinition) {
  const resourceNodes: ResourceNode[] = [];
  let state = level.seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (const island of level.islands) {
    for (const clearing of island.clearings) {
      for (const resource of clearing.resources) {
        let tried = 0;
        while (tried < 20) {
          const angle = random() * 2 * Math.PI;
          const radius = random() * (clearing.radius - 1);
          const x = island.center.x + clearing.x  + Math.floor(radius * Math.cos(angle));
          const y = island.center.y + clearing.y + Math.floor(radius * Math.sin(angle));
          if (resourceNodes.find(node => node.x === x && node.y === y)) {
            tried++;
            continue;
          }
          resourceNodes.push({
            x,
            y,
            resource: resource.type,
          });
          break;
        }
      }
    }
  }
  return resourceNodes;
}
