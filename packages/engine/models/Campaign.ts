import type {Resources, ResourcesType} from "./Resources";
import type {Position} from "./Position";
import type {MachineType, MachineVariant} from "./Machine";
import type {RecipeId} from "../config/recipeConfig";

export type LevelStatus = "locked" | "active" | "completed" | "finalized";

export type LevelObjective = {
  type: "export" | "produce" | "extract" | "store";
  resource: ResourcesType;
  amount: number;
};

export type LevelProgress = {
  id: string;
  status: LevelStatus;
  completedAt?: number;
  finalizedAt?: number;
  pollution: number;
};

export type CampaignStatistics = {
  extracted: Required<Resources>;
  produced: Required<Resources>;
  exported: Required<Resources>;
};

export type CampaignState = {
  activeLevelId: string;
  pollution: number;
  pollutionLimit: number;
  status: "playing" | "game-over" | "finished";
  levels: LevelProgress[];
  statistics: CampaignStatistics;
};

export type TunnelDefinition = {
  id: string;
  type: "input" | "output";
  position: Position;
  levelId: string;
  linkedTunnelId?: string;
};

export type CampaignLevelDefinition = {
  id: string;
  name: string;
  description: string;
  center: Position;
  radius: number;
  objective: LevelObjective;
  unlocks: {
    machines: MachineType[];
    recipes: RecipeId[];
    variants: MachineVariant[];
    resources: ResourcesType[];
  };
  tunnels: TunnelDefinition[];
};
