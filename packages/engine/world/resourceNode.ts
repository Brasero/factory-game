import type {ResourceNode} from "@engine/models/ResourceNode.ts";
import {levels} from "@engine/config/LevelConfig.ts";

export const resourceNodes: ResourceNode[] = [
  // 🪨 Gisement de fer (cluster 1)
  ...levels[0].islands[0].clearings.reduce((acc, clearing) => {
    for (const resource of clearing.resources) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * (clearing.radius - 1);
      acc.push({
        x: clearing.x + Math.floor(radius * Math.cos(angle)),
        y: clearing.y + Math.floor(radius * Math.sin(angle)),
        resource: resource.type,
      });
    }
    return acc;
  }, [] as ResourceNode[]),
];