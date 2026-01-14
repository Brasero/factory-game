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
              { type: "iron" as ResourcesType },
            ],
          },
          {
            x: 0,
            y: 0,
            radius: 5,
            resources: [
              { type: "iron" as ResourcesType },
            ],
          },
        ],
      }
    ],
  }
]