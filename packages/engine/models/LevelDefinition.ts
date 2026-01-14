import {IslandDefinition} from "./IslandDefinition";

export type LevelDefinition = {
  id: string;
  seed: number;
  
  map: {
    width: number;
    height: number;
  }
  
  islands: IslandDefinition[];
}