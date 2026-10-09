import type {Machine} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";
import {MACHINE_RECIPE_OPTIONS, RECIPES, type RecipeId} from "@engine/config/recipeConfig";
import {selectMachineRecipe, setMachinePaused} from "@web/game/GameController";
import {useWorldSelector} from "@web/game/worldStore";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";

import {productionAdvice, machineLabels} from "./productionFeedback";

const resourceNames: Record<ResourcesType, string> = {
  iron: "Minerai de fer", coal: "Charbon", water: "Eau", ironPlate: "Lingot de fer",
  steel: "Lingot d’acier", copper: "Cuivre", copperWire: "Fil de cuivre", circuit: "Circuit",
  uranium: "Uranium", uraniumCell: "Cellule d’uranium", processingUnit: "Unité de calcul",
  automationCore: "Cœur d’automatisation"
};

const ingredients = (values: Partial<Record<ResourcesType, number>>) =>
  Object.entries(values).map(([resource, amount]) => `${amount} ${resourceNames[resource as ResourcesType]}`).join(" + ");

type Props = {machine: Machine; left: number; top: number; onClose: () => void};

export function MachineRecipePanel({machine, left, top, onClose}: Props) {
  const campaignLevels = useWorldSelector(world => world.campaign.levels);
  const unlockedRecipes = new Set(CAMPAIGN_LEVELS.flatMap(level =>
    campaignLevels.find(progress => progress.id === level.id)?.status === "locked" ? [] : level.unlocks.recipes));
  const options = (MACHINE_RECIPE_OPTIONS[machine.type] ?? []).filter(recipe => unlockedRecipes.has(recipe));
  const pollution = useWorldSelector(world => world.campaign.pollution);
  const selected = machine.recipeId;
  const buffer = Object.entries(machine.buffer).filter(([, amount]) => (amount ?? 0) > 0) as [ResourcesType, number][];

  return <section className="machine-recipe-panel" style={{left, top}} role="dialog" aria-label="Configuration de la machine">
    <header>
      <div><span>Machine</span><strong>{machineLabels[machine.type] ?? machine.type}</strong></div>
      <button onClick={onClose} aria-label="Fermer">×</button>
    </header>

    <button className={`machine-pause-button ${machine.paused ? "paused" : ""}`}
      onClick={() => setMachinePaused(machine.id, !machine.paused)}>
      {machine.paused ? "▶ Reprendre la production" : "⏸ Mettre en pause"}
    </button>

    <p className="machine-advice" role="status">{productionAdvice(machine, pollution)}</p>
    <div className="machine-panel-section">
      <h3>Recette</h3>
      {options.length === 0 && <p>Cette machine ne possède pas de recette.</p>}
      {options.map(recipeId => {
        const recipe = RECIPES[recipeId];
        const inputLabel = recipe.acceptsAnyResource ? "1 ressource au choix" : ingredients(recipe.inputs);
        const outputLabel = recipe.constructionMaterials
          ? `${recipe.constructionMaterials} matériau de construction`
          : recipe.pollutionReduction ? `−${recipe.pollutionReduction} pollution` : ingredients(recipe.outputs);
        return <button key={recipeId} className={`recipe-choice ${selected === recipeId ? "selected" : ""}`}
          onClick={() => selectMachineRecipe(machine.id, recipeId as RecipeId)}>
          <strong>{recipe.name}</strong>
          <span>{inputLabel} → {outputLabel}</span>
          <small>{(recipe.duration / machine.efficiency / 10).toFixed(1)} s / cycle · {Object.entries(recipe.outputs).map(([resource, amount]) => `${((amount ?? 0) * machine.production * machine.efficiency * 10 / recipe.duration).toFixed(2)} ${resourceNames[resource as ResourcesType]}/s`).join(" · ") || (recipe.pollutionReduction ? `−${recipe.pollutionReduction} pollution/cycle` : "Recyclage")}</small>
        </button>;
      })}
    </div>

    <div className="machine-panel-section">
      <h3>Buffers <span>{machine.capacity} max par ressource</span></h3>
      {buffer.length === 0 ? <p>Vide</p> : <ul>{buffer.map(([resource, amount]) =>
        <li key={resource}><span>{resourceNames[resource]}</span><strong>{amount} / {machine.capacity}</strong></li>)}</ul>}
    </div>
  </section>;
}
