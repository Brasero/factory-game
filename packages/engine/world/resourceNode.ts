import type {ResourceNode} from "@engine/models/ResourceNode.ts";
import {levels} from "@engine/config/LevelConfig.ts";

export const resourceNodes: ResourceNode[] = [];

for (const level of levels) {
  for (const island of level.islands) {
    for (const clearing of island.clearings) {
      for (const resource of clearing.resources) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * (clearing.radius - 1);
        resourceNodes.push({
          x: island.center.x + clearing.x  + Math.floor(radius * Math.cos(angle)),
          y: island.center.y + clearing.y + Math.floor(radius * Math.sin(angle)),
          resource: resource.type,
        });
      }
    }
  }
}