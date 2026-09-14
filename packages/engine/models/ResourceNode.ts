import type {ResourcesType} from "@engine/models/Resources";
import type {Position} from "@engine/models/Position";

export interface ResourceNode extends Position {
  resource: ResourcesType;
}