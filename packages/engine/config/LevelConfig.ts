import type {LevelDefinition} from "../models/LevelDefinition";
import {CAMPAIGN_LEVELS, CAMPAIGN_MAP} from "./campaignConfig";

export const levels: LevelDefinition[] = [
  {
    id: "level-1", seed: 12345, map: CAMPAIGN_MAP,
    islands: [{
      biome: "grass", center: CAMPAIGN_LEVELS[0].center, shape: {type: "organique", size: 18, stretchX: 1.08, stretchY: 0.9, lobes: 4, roughness: 0.06},
      clearings: [
        {x: -6, y: -3, radius: 4, resources: Array.from({length: 8}, () => ({type: "iron" as const}))},
        {x: 6, y: 6, radius: 3, resources: Array.from({length: 5}, () => ({type: "water" as const}))}
      ]
    }]
  },
  {
    id: "level-2", seed: 128376, map: CAMPAIGN_MAP,
    islands: [{
      biome: "desert", center: CAMPAIGN_LEVELS[1].center, shape: {type: "smoothSquare", size: 17, stretchX: 1.12, stretchY: 0.82, rotation: 0.12},
      clearings: [
        {x: -5, y: -4, radius: 4, resources: Array.from({length: 8}, () => ({type: "coal" as const}))},
        {x: 6, y: 5, radius: 3, resources: Array.from({length: 4}, () => ({type: "iron" as const}))}
      ]
    }]
  },
  {
    id: "level-3", seed: 829104, map: CAMPAIGN_MAP,
    islands: [{
      biome: "snow", center: CAMPAIGN_LEVELS[2].center, shape: {type: "organique", size: 21, stretchX: 1.05, stretchY: 0.9, waist: 0.35, lobes: 2},
      clearings: [
        {x: -6, y: -4, radius: 4, resources: Array.from({length: 8}, () => ({type: "copper" as const}))},
        {x: 7, y: 4, radius: 3, resources: Array.from({length: 4}, () => ({type: "water" as const}))}
      ]
    }]
  },
  {
    id: "level-4", seed: 410247, map: CAMPAIGN_MAP,
    islands: [{
      biome: "grass", center: CAMPAIGN_LEVELS[3].center, shape: {type: "smoothSquare", size: 16, stretchX: 1.12, stretchY: 0.9, rotation: -0.15},
      clearings: [
        {x: -6, y: -4, radius: 4, resources: Array.from({length: 8}, () => ({type: "uranium" as const}))},
        {x: 7, y: 5, radius: 3, resources: Array.from({length: 4}, () => ({type: "water" as const}))}
      ]
    }]
  },
  {
    id: "level-5", seed: 550381, map: CAMPAIGN_MAP,
    islands: [{
      biome: "desert", center: CAMPAIGN_LEVELS[4].center, shape: {type: "organique", size: 21, stretchX: 0.94, stretchY: 1.05, lobes: 3, roughness: 0.13},
      clearings: [
        {x: -6, y: -4, radius: 4, resources: Array.from({length: 6}, () => ({type: "copper" as const}))},
        {x: 7, y: 5, radius: 3, resources: Array.from({length: 5}, () => ({type: "coal" as const}))}
      ]
    }]
  },
  {
    id: "level-6", seed: 690517, map: CAMPAIGN_MAP,
    islands: [{
      biome: "snow", center: CAMPAIGN_LEVELS[5].center, shape: {type: "smoothSquare", size: 20, stretchX: 1.04, stretchY: 0.88, rotation: 0.2},
      clearings: [
        {x: -6, y: -4, radius: 4, resources: Array.from({length: 6}, () => ({type: "iron" as const}))},
        {x: 7, y: 5, radius: 3, resources: Array.from({length: 5}, () => ({type: "water" as const}))}
      ]
    }]
  }
];
