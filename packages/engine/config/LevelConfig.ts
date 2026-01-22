import {LevelDefinition} from "../models/LevelDefinition";

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
          x: 45,
          y: 15,
        },
        shape: {
          type: "organique",
          size: 15,
        },
        clearings: [
          {
            x: -5,
            y: -2,
            radius: 3,
            resources: [
              { type: "iron" },
              { type: "iron" },
              { type: "iron" },
              { type: "iron" }
            ],
          },
          {
            x: 4,
            y: 3,
            radius: 1,
            resources: [
              { type: "iron" },
            ],
          },
          {
            x: 5,
            y: -10,
            radius: 2,
            resources: [
              { type: "water" },
              { type: "water" },
              { type: "water" },
            ]
          }
        ],
      }
    ],
  },
  {
    id: "level-2",
    seed: 128376,
    map: {
      width: 200,
      height: 200,
    },
    islands: [
      {
        biome: "desert",
        center:{
          x: 45,
          y: 45,
        },
        shape: {
          type: "smoothSquare",
          size: 20,
        },
        clearings: [
          {
            x: -10,
            y: -2,
            radius: 3,
            resources: [
              { type: "coal" },
              { type: "coal" },
              { type: "coal" },
              { type: "coal" }
            ],
          },
          {
            x: 8,
            y: -7,
            radius: 2,
            resources: [
              { type: "iron" },
              { type: "iron" },
              { type: "iron" },
            ],
          }
        ],
      }
    ],
  },
  {
    id: "level-3",
    seed: 128376,
    map: {
      width: 200,
      height: 200,
    },
    islands: [
      {
        biome: "snow",
        center:{
          x: 45,
          y: 45,
        },
        shape: {
          type: "smoothSquare",
          size: 20,
        },
        clearings: [
          {
            x: 10,
            y: 2,
            radius: 3,
            resources: [
              { type: "coal" },
              { type: "coal" },
              { type: "coal" },
              { type: "coal" }
            ],
          },
          {
            x: 8,
            y: -7,
            radius: 2,
            resources: [
              { type: "iron" },
              { type: "iron" },
              { type: "iron" },
            ],
          },
          {
            x: -8,
            y: 7,
            radius: 3,
            resources: [
              { type: "water" },
              { type: "water" },
              { type: "water" },
            ],
          }
        ],
      }
    ],
  }
]