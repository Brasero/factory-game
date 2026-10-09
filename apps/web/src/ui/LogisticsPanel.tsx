import type {Conveyor, SmartSplitterPort} from "@engine/models/Conveyor";
import type {Storage} from "@engine/models/Storage";
import {setConveyorRegulation, setStorageReserve} from "@web/game/GameController";
import {useLogisticsLocked} from "./useLogisticsLocked";
import {resourceLabels} from "./productionFeedback";
import {LOGISTICS_OUTPUT_RATES} from "@engine/config/logisticsConfig";


export function ConveyorRegulationControls({conveyor}: {conveyor: Conveyor}) {
  const locked = useLogisticsLocked(conveyor);
  return <div className="logistics-controls">
    <label>Limite de sortie
      <select aria-label="Limite de sortie" disabled={locked} value={conveyor.outputRate ?? "unlimited"}
        onChange={event => setConveyorRegulation(conveyor.id, event.target.value === "unlimited" ? undefined : Number(event.target.value), conveyor.priorityPort)}>
        <option value="unlimited">Sans limite</option>
        {LOGISTICS_OUTPUT_RATES.map(rate => <option key={rate} value={rate}>{rate.toLocaleString("fr-FR")} {rate <= 1 ? "unité" : "unités"} / seconde simulée</option>)}
      </select>
    </label>
    <small>Le limiteur plafonne la sortie sans accélérer le tapis. Une unité au maximum peut être conservée en crédit ; le reste attend.</small>
    {(conveyor.type === "splitter" || conveyor.type === "smart-splitter") && <>
      <label>Sortie prioritaire
        <select aria-label="Sortie prioritaire" disabled={locked} value={conveyor.priorityPort ?? "balanced"}
          onChange={event => setConveyorRegulation(conveyor.id, conveyor.outputRate, event.target.value === "balanced" ? undefined : event.target.value as SmartSplitterPort)}>
          <option value="balanced">Répartition équilibrée</option><option value="forward">Face</option>
          <option value="left">Gauche</option><option value="right">Droite</option>
        </select>
      </label>
      <small>La priorité respecte les filtres. Si elle est bloquée, les autres sorties prennent le relais. Une priorité toujours libre peut priver les autres chaînes.</small>
    </>}
    {locked && <p>Ces réglages sont verrouillés avec l’île.</p>}
  </div>;
}

export function LogisticsPanel({entity, left, top, onClose}: {entity: Conveyor | Storage; left: number; top: number; onClose: () => void}) {
  const locked = useLogisticsLocked(entity);
  return <section className="machine-recipe-panel logistics-panel" style={{left, top, maxHeight: `calc(100dvh - ${top}px - 24px)`}}
    role="dialog" aria-label="Régulation des flux">
    <header><div><span>Logistique</span><strong>{entity.entityType === "storage" ? "Réserve du coffre" : "Régulation du tapis"}</strong></div>
      <button onClick={onClose} aria-label="Fermer">×</button></header>
    {entity.entityType === "conveyor" ? <ConveyorRegulationControls conveyor={entity}/> : <div className="logistics-controls">
      <label>Réserve minimale par ressource
        <input aria-label="Réserve minimale par ressource" type="number" min={0} max={entity.capacity} step={1} disabled={locked}
          value={entity.reserveThreshold ?? 0} onChange={event => setStorageReserve(entity.id, Number(event.target.value))}/>
      </label>
      <small>Seul le surplus au-dessus du seuil sort. La capacité totale reste {entity.capacity} unités, toutes ressources confondues. Un seuil trop élevé peut remplir le coffre et bloquer les entrées.</small>
      <p>{Object.entries(entity.stored).filter(([, amount]) => amount).map(([resource, amount]) => `${amount} ${resourceLabels[resource]}`).join(" · ") || "Coffre vide"}</p>
      {locked && <p>La réserve est verrouillée avec l’île.</p>}
    </div>}
  </section>;
}
