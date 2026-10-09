import type {Tunnel, TunnelOutputFilter} from "@engine/models/Tunnel";
import type {DirectionType} from "@engine/models/Conveyor";
import {RESOURCE_TYPES} from "@engine/models/Resources";
import {setTunnelFilter} from "@web/game/GameController";
import {tunnelOutputFilter} from "@engine/systems/TunnelFilters";
import {resourceLabels} from "./productionFeedback";

const sides: {id: DirectionType; label: string; arrow: string}[] = [
  {id: "up", label: "Sortie haute", arrow: "↑"},
  {id: "right", label: "Sortie droite", arrow: "→"},
  {id: "down", label: "Sortie basse", arrow: "↓"},
  {id: "left", label: "Sortie gauche", arrow: "←"}
];

export function TunnelPanel({tunnel, left, top, onClose}: {tunnel: Tunnel; left: number; top: number; onClose: () => void}) {
  return <section className="machine-recipe-panel tunnel-panel smart-splitter-panel" style={{left, top, maxHeight: `min(480px, calc(100dvh - ${top}px - 48px))`}} role="dialog" aria-label="Ressources du tunnel d’entrée">
    <header><div><span>Transport inter-îles</span><strong>Tunnel d’entrée</strong></div><button aria-label="Fermer" onClick={onClose}>×</button></header>
    <p>Choisis ce qui sort de chaque côté, comme sur un splitter intelligent. Haut, droite, bas et gauche correspondent aux directions de la carte.</p>
    <div className="smart-splitter-ports">
      {sides.map(side => <label key={side.id}>
        <span><b>{side.arrow}</b>{side.label}</span>
        <select aria-label={side.label} value={tunnelOutputFilter(tunnel, side.id)}
          onChange={event => setTunnelFilter(tunnel.id, side.id, event.target.value as TunnelOutputFilter)}>
          <option value="any">Toutes les ressources</option>
          <option value="unfiltered">Toute ressource non filtrée</option>
          <option value="none">Sortie fermée</option>
          {RESOURCE_TYPES.filter(resource => resource !== "water").map(resource => <option key={resource} value={resource}>{resourceLabels[resource]} · {tunnel.stored[resource] ?? 0} en stock</option>)}
        </select>
      </label>)}
    </div>
    <small>Les filtres s’appliquent aux tapis et aux machines voisins. Les autres produits restent stockés. L’eau circule par les tuyaux ; ces réglages restent disponibles sur une île finalisée.</small>
  </section>;
}
