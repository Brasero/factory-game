import {ResourcesType} from "@engine/models/Resources";
import {Position} from "@engine/models/Position";

export interface ResourceNode extends Position {
  resource: ResourcesType;
}