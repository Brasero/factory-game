import type {ContractDefinition} from "@engine/models/Contract";

export const CONTRACTS: ContractDefinition[] = [
  {id: "school", name: "Un atelier pour apprendre", community: "Les apprentis de l’archipel", levelId: "level-1",
    description: "Équiper le premier atelier avec des lingots de fer.", requirements: {ironPlate: 15}, reward: 20, distinction: "Premier mécène"},
  {id: "port", name: "Réparer le port", community: "La communauté du port", levelId: "level-2",
    description: "Renforcer les quais avec du fer et de l’acier.", requirements: {ironPlate: 20, steel: 10}, reward: 35, distinction: "Bâtisseur du port"},
  {id: "bridge", name: "Le pont avant la marée", community: "Les passeurs", levelId: "level-2",
    description: "Préparer les poutres avant la prochaine marée. Le délai commence à l’acceptation.", requirements: {steel: 12}, reward: 40,
    distinction: "Livraison ponctuelle", timeLimit: 1800},
  {id: "workshop", name: "Équiper un atelier", community: "La coopérative des artisans", levelId: "level-3",
    description: "Livrer des circuits tout en conservant les exportations d’acier de l’île 2.", requirements: {circuit: 8}, reward: 45,
    distinction: "Industrie solidaire", rate: {levelId: "level-2", resource: "steel", amount: 2, duration: 100}}
];
export const contractDefinition = (id: string) => CONTRACTS.find(contract => contract.id === id);
