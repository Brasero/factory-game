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
    radius: 32,
    objective: {type: "export", resource: "ironPlate", amount: 50},
    unlocks: {
      machines: ["iron-mine", "iron-smelter"],
      recipes: ["iron-smelting"],
      variants: ["standard"],
      resources: ["iron", "ironPlate"]
    },
    tunnels: [{id: "level-1-output", type: "output", position: {x: 61, y: 55}, levelId: "level-1", linkedTunnelId: "level-2-input"}]
  },
  {
    id: "level-2",
    name: "L’acier",
    description: "Combiner les productions de plusieurs îles et arbitrer entre vitesse et pollution.",
    center: {x: 120, y: 55},
    radius: 32,
    objective: {type: "export", resource: "steel", amount: 40},
    unlocks: {
      machines: ["coal-mine", "water-pump", "boiler", "recycler"],
      recipes: ["steel-smelting", "water-purification", "recycling"],
      variants: ["eco", "industrial"],
      resources: ["coal", "water", "steel"]
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
    radius: 32,
    objective: {type: "export", resource: "circuit", amount: 30},
    unlocks: {
      machines: ["copper-mine", "assembler"],
      recipes: ["copper-wire", "circuit-assembly"],
      variants: ["eco"],
      resources: ["copper", "copperWire", "circuit"]
    },
    tunnels: [
      {id: "level-3-input", type: "input", position: {x: 179, y: 55}, levelId: "level-3"},
      {id: "level-3-output", type: "output", position: {x: 211, y: 55}, levelId: "level-3", linkedTunnelId: "level-4-input"}
    ]
  },
  {
    id: "level-4",
    name: "Énergie instable",
    description: "Conditionner l’uranium dans une enveloppe d’acier sans perdre le contrôle de la pollution.",
    center: {x: 45, y: 135},
    radius: 32,
    objective: {type: "export", resource: "uraniumCell", amount: 25},
    unlocks: {
      machines: ["uranium-mine"],
      recipes: ["uranium-cell"],
      variants: [],
      resources: ["uranium", "uraniumCell"]
    },
    tunnels: [
      {id: "level-4-input", type: "input", position: {x: 29, y: 135}, levelId: "level-4"},
      {id: "level-4-output", type: "output", position: {x: 61, y: 135}, levelId: "level-4", linkedTunnelId: "level-5-input"}
    ]
  },
  {
    id: "level-5",
    name: "Calcul industriel",
    description: "Rassembler trois chaînes de production pour fabriquer des unités de calcul avancées.",
    center: {x: 120, y: 135},
    radius: 32,
    objective: {type: "export", resource: "processingUnit", amount: 18},
    unlocks: {
      machines: [],
      recipes: ["processing-unit"],
      variants: [],
      resources: ["processingUnit"]
    },
    tunnels: [
      {id: "level-5-input", type: "input", position: {x: 104, y: 135}, levelId: "level-5"},
      {id: "level-5-output", type: "output", position: {x: 136, y: 135}, levelId: "level-5", linkedTunnelId: "level-6-input"}
    ]
  },
  {
    id: "level-6",
    name: "Cœur de l’archipel",
    description: "Synchroniser les productions de toutes les îles pour assembler le composant final.",
    center: {x: 195, y: 135},
    radius: 32,
    objective: {type: "export", resource: "automationCore", amount: 10},
    unlocks: {
      machines: ["advanced-assembler"],
      recipes: ["automation-core"],
      variants: [],
      resources: ["automationCore"]
    },
    tunnels: [
      {id: "level-6-input", type: "input", position: {x: 179, y: 135}, levelId: "level-6"},
      {id: "level-6-output", type: "output", position: {x: 211, y: 135}, levelId: "level-6"}
    ]
  }
];

// Les fenêtres utilisent les ticks simulés (100 ticks = 10 secondes).
const characters = ["Une première usine accueillante", "Équilibrer fer et charbon", "Relier deux plateaux", "Limiter les émissions de l’uranium", "Partager les ingrédients", "Synchroniser l’archipel"];
CAMPAIGN_LEVELS.forEach((level, index) => {
  level.character = characters[index];
  const resource = level.objective.resource;
  level.challenges = [
    {id: "cadence", name: "Cadence régulière", description: "Maintenir le débit pendant 10 secondes. Les interruptions suspendent le défi.",
      objective: {type: "export", resource, amount: 5, rate: {amount: index < 3 ? 2 : 1, window: 100, duration: 100}}, reward: 15},
    {id: "propre", name: "Livraison propre", description: "Livrer sous un budget d’émissions brutes. Un dépassement démarre un nouvel essai.",
      objective: {type: "export", resource, amount: index < 3 ? 10 : 3, emissionBudget: index < 3 ? 80 : 150}, reward: 15}
  ];
});
CAMPAIGN_LEVELS[1].objective.rate = {amount: 2, window: 100, duration: 100};
CAMPAIGN_LEVELS[3].objective.emissionBudget = 250;
CAMPAIGN_LEVELS[4].objective.requirements = {processingUnit: 18, circuit: 6, steel: 6};
CAMPAIGN_LEVELS[5].objective.rate = {amount: 1, window: 100, duration: 100};

export function campaignLevelAt(x: number, y: number): CampaignLevelDefinition | undefined {
  return CAMPAIGN_LEVELS.find(level => Math.hypot(x - level.center.x, y - level.center.y) <= level.radius);
}

export function objectiveValue(statistics: {extracted: Record<ResourcesType, number>; produced: Record<ResourcesType, number>; exported: Record<ResourcesType, number>},
  stored: Partial<Record<ResourcesType, number>>, level: CampaignLevelDefinition): number {
  const {type, resource} = level.objective;
  if (type === "store") return stored[resource] ?? 0;
  return statistics[type === "extract" ? "extracted" : type === "produce" ? "produced" : "exported"][resource] ?? 0;
}
