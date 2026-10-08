import type {Machine} from "@engine/models/Machine";
import {machineIdleReason} from "@engine/systems/MachineStatus";

export const resourceLabels: Record<string, string> = {iron: "fer", coal: "charbon", water: "eau", ironPlate: "lingots", steel: "acier", copper: "cuivre", copperWire: "fils de cuivre", circuit: "circuits", uranium: "uranium", uraniumCell: "cellules", processingUnit: "unités de calcul", automationCore: "cœurs"};
export const machineLabels: Record<string, string> = {"iron-mine": "Mineur", "coal-mine": "Mineur", "copper-mine": "Mineur", "uranium-mine": "Mineur", "water-pump": "Pompe à eau", "iron-smelter": "Fonderie", assembler: "Machine de production", "advanced-assembler": "Assembleuse avancée", boiler: "Boiler", recycler: "Recycleur"};

export function productionAdvice(machine: Machine, pollution: number): string {
  const reason = machineIdleReason(machine, pollution);
  switch (reason?.type) {
    case "paused": return "Machine en pause : reprends la production pour alimenter la chaîne.";
    case "no-recipe": return "Aucune recette : choisis le produit à fabriquer.";
    case "missing-input": return `Ingrédient manquant (${resourceLabels[reason.resource]}) : vérifie la source et les raccordements.`;
    case "missing-any-input": return "Aucun surplus reçu : raccorde un tapis ou un coffre au recycleur.";
    case "output-full": return "Sortie pleine : augmente le débit de sortie ou ajoute du stockage.";
    case "buffer-full": return "Buffer plein : raccorde une sortie disponible.";
    case "pollution-empty": return "Air propre : le boiler reprendra automatiquement lorsque la pollution remontera.";
    default: return "Production disponible : compare les cadences pour équilibrer les ingrédients.";
  }
}
