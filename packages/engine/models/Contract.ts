import type {Resources, ResourcesType} from "./Resources";

export type ContractDefinition = {
  id: string;
  name: string;
  community: string;
  description: string;
  levelId: string;
  requirements: Partial<Resources>;
  reward: number;
  distinction: string;
  timeLimit?: number;
  restoration?: {levelId: string; absorptionBonus: number};
  rate?: {levelId: string; resource: ResourcesType; amount: number; duration: number};
};
export type ContractProgress = {
  id: string;
  status: "active" | "completed" | "cancelled" | "failed";
  acceptedAt: number;
  deadlineAt?: number;
  endedAt?: number;
  reserved: Partial<Resources>;
  sustained: number;
  lastTick?: number;
  attempts: number;
};
