import type {LevelDefinition} from "../models/LevelDefinition";
import {CAMPAIGN_LEVELS, CAMPAIGN_MAP} from "./campaignConfig";

export const levels: LevelDefinition[] = [
  {
    id: "level-1", seed: 12345, map: CAMPAIGN_MAP,
    islands: [{
      biome: "grass", center: CAMPAIGN_LEVELS[0].center, shape: {type: "organique", size: 18},
      clearings: [
        {x: -6, y: -3, radius: 4, resources: Array.from({length: 8}, () => ({type: "iron" as const}))},
        {x: 6, y: 6, radius: 3, resources: Array.from({length: 5}, () => ({type: "water" as const}))}
      ]
    }]
  },
  {
    id: "level-2", seed: 128376, map: CAMPAIGN_MAP,
    islands: [{
      biome: "desert", center: CAMPAIGN_LEVELS[1].center, shape: {type: "smoothSquare", size: 19},
      clearings: [
        {x: -5, y: -4, radius: 4, resources: Array.from({length: 8}, () => ({type: "coal" as const}))},
        {x: 6, y: 5, radius: 3, resources: Array.from({length: 4}, () => ({type: "iron" as const}))}
      ]
    }]
  },
  {
    id: "level-3", seed: 829104, map: CAMPAIGN_MAP,
    islands: [{
      biome: "snow", center: CAMPAIGN_LEVELS[2].center, shape: {type: "organique", size: 19},
      clearings: [
        {x: -6, y: -4, radius: 4, resources: Array.from({length: 8}, () => ({type: "copper" as const}))},
        {x: 7, y: 4, radius: 3, resources: Array.from({length: 4}, () => ({type: "water" as const}))}
      ]
    }]
  }
];
