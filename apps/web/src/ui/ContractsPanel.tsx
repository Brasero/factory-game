import {useState} from "react";
import {CONTRACTS} from "@engine/config/contractConfig";
import {CAMPAIGN_LEVELS, campaignLevelAt} from "@engine/config/campaignConfig";
import {useWorldSnapshot} from "@web/game/worldStore";
import {acceptContract, assignContract, cancelContract} from "@web/game/GameController";
import {resourceLabels} from "./productionFeedback";

const statusLabels = {active: "En cours", completed: "Livré", cancelled: "Annulé", failed: "Délai dépassé"};

export function ContractsPanel() {
  const world = useWorldSnapshot();
  const [open, setOpen] = useState(false);
  const playing = world.campaign.status === "playing";
  const priority = (id: string) => world.campaign.contracts?.[id]?.status === "active" ? 0 : world.campaign.contracts?.[id]?.status === "completed" ? 2 : 1;
  const available = CONTRACTS.filter(contract => world.campaign.levels.some(level => level.id === contract.levelId && level.status !== "locked")).sort((a, b) => priority(a.id) - priority(b.id));
  const active = available.filter(contract => world.campaign.contracts?.[contract.id]?.status === "active");
  const depots = world.storages.filter(storage => storage.kind === "shipping-depot");
  return <aside className="contracts-panel">
    <button data-tutorial="contracts" aria-expanded={open} onClick={() => setOpen(value => !value)}>Contrats {active.length > 0 ? `(${active.length})` : ""}</button>
    {open && <section aria-label="Contrats de l’archipel">
      <h3>Commandes des communautés</h3>
      <p>Accepte une commande quand ton usine est prête, puis affecte-la à un point d’expédition raccordé aux tapis.</p>
      <p>Les produits sont consommés à la réussite, sans compter pour les objectifs de campagne.</p>
      <details><summary>Comment gérer les expéditions ?</summary><p>Construis un point d’expédition pour 20 matériaux et raccorde tes tapis. Les produits restent réservés sur place jusqu’à la livraison complète. Utilise un splitter pour partager le flux avec les tunnels. Une annulation ou un échec libère le stock : récupère-le par un tapis orienté vers l’extérieur.</p></details>
      {available.map(contract => {
        const progress = world.campaign.contracts?.[contract.id];
        const isActive = progress?.status === "active";
        return <article key={contract.id} className="contract-card">
          <strong>{contract.name}</strong><small>{contract.community} · {progress ? statusLabels[progress.status] : "Disponible"}</small>
          <p>{contract.description}</p>
          <ul>{Object.entries(contract.requirements).map(([resource, target]) => <li key={resource}>
            {Math.min(progress?.reserved[resource as keyof typeof progress.reserved] ?? 0, target!)} / {target} {resourceLabels[resource]}
          </li>)}</ul>
          <small>{contract.timeLimit === undefined ? "Sans délai" : isActive ? `Temps restant : ${Math.max(0, Math.ceil((progress.deadlineAt! - world.tick) / 10))} s simulées` : `Délai : ${contract.timeLimit / 10} s après acceptation`}</small>
          {contract.rate && <small>Île 2 : ≥ {contract.rate.amount} aciers exportés / 10 s · Effort : {((progress?.sustained ?? 0) / 10).toFixed(1)} / {contract.rate.duration / 10} s cumulées. Les interruptions suspendent l’effort.</small>}
          <small>Récompense : +{contract.reward} matériaux · Distinction : {contract.distinction}</small>
          {progress?.status === "completed" ? <b className="contract-distinction">✓ {contract.distinction}</b>
            : isActive ? <button disabled={!playing} onClick={() => cancelContract(contract.id)}>Annuler et libérer le stock</button>
            : <button disabled={!playing} onClick={() => acceptContract(contract.id)}>{progress ? "Accepter un nouvel essai" : "Accepter"}</button>}
        </article>;
      })}
      <h3>Points d’expédition</h3>
      {!depots.length && <p>Pose ton premier point depuis le menu Construction.</p>}
      {depots.map(depot => {
        const level = campaignLevelAt(depot.x, depot.y) ?? CAMPAIGN_LEVELS.find(level => level.id === world.campaign.activeLevelId);
        const finalized = world.campaign.levels.find(progress => progress.id === level?.id)?.status === "finalized";
        return <div className="depot-assignment" key={depot.id}>
          <label>Point ({depot.x}, {depot.y}) · {level?.name}
            <select aria-label={`Commande du point ${depot.x}, ${depot.y}`} value={depot.contractId ?? ""} disabled={!playing || finalized}
              onChange={event => assignContract(depot.id, event.target.value || undefined)}>
              <option value="">Aucune — restituer le stock</option>
              {active.map(contract => <option key={contract.id} value={contract.id} disabled={depots.some(other => other.id !== depot.id && other.contractId === contract.id)}>{contract.name}</option>)}
            </select>
          </label>
          <small>Stock : {Object.entries(depot.stored).filter(([, amount]) => amount).map(([resource, amount]) => `${amount} ${resourceLabels[resource]}`).join(", ") || "vide"}</small>
        </div>;
      })}
      <p>Un point par commande ; plusieurs commandes peuvent avancer en parallèle. Après annulation ou échec, un tapis orienté vers l’extérieur récupère les produits. La réaffectation conserve le stock et réserve seulement les ingrédients utiles. Vide le point avant de le démolir.</p>
    </section>}
  </aside>;
}
