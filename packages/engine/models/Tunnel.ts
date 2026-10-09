import type {BaseEntity} from "./BaseEntity";
import type {DirectionType, SmartSplitterFilter} from "./Conveyor";
import type {Resources, ResourcesType} from "./Resources";

export type TunnelOutputFilter = SmartSplitterFilter | "none";

export interface Tunnel extends BaseEntity {
  entityType: "tunnel";
  type: "input" | "output";
  levelId: string;
  linkedTunnelId?: string;
  direction: DirectionType;
  capacity: number;
  outputFilters?: Partial<Record<DirectionType, TunnelOutputFilter>>;
  /** Ancien filtre global, conservé seulement pour migrer les sauvegardes. */
  outputResource?: ResourcesType;
  stored: Resources;
}
