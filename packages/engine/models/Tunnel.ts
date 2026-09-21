import type {BaseEntity} from "./BaseEntity";
import type {DirectionType} from "./Conveyor";
import type {Resources} from "./Resources";

export interface Tunnel extends BaseEntity {
  entityType: "tunnel";
  type: "input" | "output";
  levelId: string;
  linkedTunnelId?: string;
  direction: DirectionType;
  capacity: number;
  stored: Resources;
}
