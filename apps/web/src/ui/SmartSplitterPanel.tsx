import type {Conveyor, ResourcesType, SmartSplitterFilter, SmartSplitterPort} from "@engine/api/types";
import {RESOURCE_TYPES} from "@engine/models/Resources";
import {setSmartSplitterFilter} from "@web/game/GameController";

const resourceNames: Record<ResourcesType, string> = {
  iron: "Minerai de fer", coal: "Charbon", water: "Eau", ironPlate: "Lingot de fer",
  steel: "Lingot d’acier", copper: "Cuivre", copperWire: "Fil de cuivre", circuit: "Circuit",
  uranium: "Uranium", uraniumCell: "Cellule d’uranium", processingUnit: "Unité de calcul",
  automationCore: "Cœur d’automatisation"
};
const ports: Array<{id: SmartSplitterPort; label: string; arrow: string}> = [
  {id: "left", label: "Sortie gauche", arrow: "↰"},
  {id: "forward", label: "Sortie face", arrow: "↑"},
  {id: "right", label: "Sortie droite", arrow: "↱"}
];

export function SmartSplitterPanel({splitter, left, top, onClose}: {
  splitter: Conveyor; left: number; top: number; onClose: () => void;
}) {
  return <section className="machine-recipe-panel smart-splitter-panel" style={{left, top}}
    role="dialog" aria-label="Configuration du splitter intelligent">
    <header>
      <div><span>Routeur</span><strong>Splitter intelligent</strong></div>
      <button onClick={onClose} aria-label="Fermer">×</button>
    </header>
    <p className="smart-splitter-help">Choisis ce qui peut sortir de chaque côté. Les directions sont relatives à l’orientation du splitter.</p>
    <div className="smart-splitter-ports">
      {ports.map(port => <label key={port.id}>
        <span><b>{port.arrow}</b>{port.label}</span>
        <select value={splitter.outputFilters?.[port.id] ?? "any"}
          onChange={event => setSmartSplitterFilter(splitter.id, port.id, event.target.value as SmartSplitterFilter)}>
          <option value="any">Toutes les ressources</option>
          <option value="unfiltered">Toute ressource non filtrée</option>
          {RESOURCE_TYPES.filter(resource => resource !== "water").map(resource =>
            <option key={resource} value={resource}>{resourceNames[resource]}</option>)}
        </select>
      </label>)}
    </div>
  </section>;
}
