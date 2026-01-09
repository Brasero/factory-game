import type {ResourceNode} from "@engine/models/ResourceNode.ts";

export const resourceNodes: ResourceNode[] = [
  // 🪨 Gisement de fer (cluster 1)
  { x: 2, y: 3, resource: "iron" },
  { x: 3, y: 3, resource: "iron" },
  { x: 2, y: 4, resource: "iron" },
  { x: 3, y: 4, resource: "iron" },
  
  // 🪨 Gisement de fer (cluster 2)
  { x: 12, y: 2, resource: "iron" },
  { x: 13, y: 2, resource: "iron" },
  { x: 12, y: 3, resource: "iron" },
  
  // 🪵 Charbon (cluster 1)
  { x: 6, y: 6, resource: "coal" },
  { x: 7, y: 6, resource: "coal" },
  { x: 6, y: 7, resource: "coal" },
  
  // 🪵 Charbon (cluster 2)
  { x: 15, y: 10, resource: "coal" },
  { x: 16, y: 10, resource: "coal" },
  { x: 15, y: 11, resource: "coal" },
  
  // 💧 Eau (rivière / nappe)
  { x: 4, y: 11, resource: "water" },
  { x: 4, y: 12, resource: "water" },
  { x: 4, y: 13, resource: "water" },
  { x: 4, y: 14, resource: "water" },
  
  // 💧 Eau (petit point isolé)
  { x: 18, y: 4, resource: "water" }
];