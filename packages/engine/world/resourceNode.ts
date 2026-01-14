import type {ResourceNode} from "@engine/models/ResourceNode.ts";

export const resourceNodes: ResourceNode[] = [
  // 🪨 Gisement de fer (cluster 1)
  { x: 2+37, y: 3+37, resource: "iron" },
  { x: 3+37, y: 3+37, resource: "iron" },
  { x: 2+37, y: 4+37, resource: "iron" },
  { x: 3+37, y: 4+37, resource: "iron" },
  { x: 2+37, y: 5+37, resource: "iron" },
  { x: 3+37, y: 5+37, resource: "iron" },
  
  // 🪨 Gisement de fer (cluster 2)
  { x: 12+37, y: 1+37, resource: "iron" },
  { x: 12+37, y: 2+37, resource: "iron" },
  { x: 13+37, y: 2+37, resource: "iron" },
  { x: 12+37, y: 3+37, resource: "iron" },
];