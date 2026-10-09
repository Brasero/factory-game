import {CONTRACTS} from "./contractConfig";
import type {CampaignState} from "@engine/models/Campaign";

// Le total reste 0,02 : les différences des îles ne changent pas l'équilibre initial.
export const ISLAND_ABSORPTION: Record<string, number> = {
  "level-1": 0.005, "level-2": 0.003, "level-3": 0.004,
  "level-4": 0.002, "level-5": 0.004, "level-6": 0.002
};

export function islandAbsorption(campaign: CampaignState, levelId: string): number {
  return (ISLAND_ABSORPTION[levelId] ?? 0) + CONTRACTS.reduce((sum, contract) =>
    sum + (contract.restoration?.levelId === levelId && campaign.contracts?.[contract.id]?.status === "completed"
      ? contract.restoration.absorptionBonus : 0), 0);
}

export function naturalAbsorption(campaign: CampaignState): number {
  // Toutes les îles existent dès le départ, indépendamment de leur accessibilité.
  return Object.keys(ISLAND_ABSORPTION).reduce((sum, id) => sum + islandAbsorption(campaign, id), 0);
}
