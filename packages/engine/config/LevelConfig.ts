import {LevelDefinition} from "../models/LevelDefinition";
import type {ResourcesType} from "@engine/models/Resources.ts";

export const levels: LevelDefinition[] = [
  {
    id: "level-1",
    seed: 12345,
    map: {
      width: 200,
      height: 200,
    },
    islands: [
      {
        biome: "grass",
        center:{
          x: 35,
          y: 35,
        },
        shape: {
          type: "organique",
          size: 30,
        },
        clearings: [
          {
            x: -10,
            y: -10,
            radius: 4,
            resources: [
              { type: "iron" },
              { type: "iron" },
              { type: "iron" },
              { type: "iron" }
            ],
          },
          {
            x: 10,
            y: 10,
            radius: 5,
            resources: [
              { type: "iron" },
            ],
          },
        ],
      }
    ],
  }
]