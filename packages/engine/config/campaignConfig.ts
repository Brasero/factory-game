import type {CampaignLevelDefinition} from "@engine/models/Campaign";
import type {ResourcesType} from "@engine/models/Resources";

export const CAMPAIGN_MAP = {width: 250, height: 190};
export const CAMPAIGN_POLLUTION_LIMIT = 900;
export const NATURAL_POLLUTION_RECOVERY = 0.02;

export const CAMPAIGN_LEVELS: CampaignLevelDefinition[] = [
  {
    id: "level-1",
    name: "Premiers lingots",
    description: "Extraire le fer et mettre en place une première chaîne automatisée.",
    center: {x: 45, y: 55},
    radius: 24,
    objective: {type: "export", resource: "ironPlate", amount: 50},
    unlocks: {
      machines: ["iron-mine", "water-pump", "iron-smelter"],
      recipes: ["iron-smelting"],
      variants: ["standard"],
      resources: ["iron", "water", "ironPlate"]
    },
    tunnels: [{id: "level-1-output", type: "output", position: {x: 61, y: 55}, levelId: "level-1", linkedTunnelId: "level-2-input"}]
  },
  {
    id: "level-2",
    name: "L’acier",
    description: "Combiner les productions de plusieurs îles et arbitrer entre vitesse et pollution.",
    center: {x: 120, y: 55},
    radius: 24,
    objective: {type: "export", resource: "steel", amount: 40},
    unlocks: {
      machines: ["coal-mine", "boiler"],
      recipes: ["steel-smelting", "water-purification"],
      variants: ["eco", "industrial"],
      resources: ["coal", "steel"]
    },
    tunnels: [
      {id: "level-2-input", type: "input", position: {x: 104, y: 55}, levelId: "level-2"},
      {id: "level-2-output", type: "output", position: {x: 136, y: 55}, levelId: "level-2", linkedTunnelId: "level-3-input"}
    ]
  },
  {
    id: "level-3",
    name: "Circuit propre",
    description: "Produire des circuits tout en maîtrisant l’empreinte de l’archipel.",
    center: {x: 195, y: 55},
    radius: 24,
    objective: {type: "export", resource: "circuit", amount: 30},
    unlocks: {
      machines: ["copper-mine", "assembler"],
      recipes: ["copper-wire", "circuit-assembly"],
      variants: ["eco"],
      resources: ["copper", "copperWire", "circuit"]
    },
    tunnels: [
      {id: "level-3-input", type: "input", position: {x: 179, y: 55}, levelId: "level-3"},
      {id: "level-3-output", type: "output", position: {x: 211, y: 55}, levelId: "level-3"}
    ]
  }
];

export function campaignLevelAt(x: number, y: number): CampaignLevelDefinition | undefined {
  return CAMPAIGN_LEVELS.find(level => Math.hypot(x - level.center.x, y - level.center.y) <= level.radius);
}

export function objectiveValue(statistics: {extracted: Record<ResourcesType, number>; produced: Record<ResourcesType, number>; exported: Record<ResourcesType, number>},
  stored: Partial<Record<ResourcesType, number>>, level: CampaignLevelDefinition): number {
  const {type, resource} = level.objective;
  if (type === "store") return stored[resource] ?? 0;
  return statistics[type === "extract" ? "extracted" : type === "produce" ? "produced" : "exported"][resource] ?? 0;
}
