import {ResourcesType} from "./Resources";

export type ClearingDefinition = {
  radius: number;
  x: number;
  y: number;
  resources: {
    type: ResourcesType;
  }[];
}