import {useState} from "react";
import {useWorldSelector} from "@web/game/worldStore";
import {CAMPAIGN_LEVELS, objectiveValue} from "@engine/config/campaignConfig";
import {activateLevel, finalizeLevel} from "@web/game/GameController";
import {assetManager} from "@web/render/manager/AssetManager";
import type {ResourcesType} from "@engine/models/Resources";

const resourceNames: Record<string, string> = {
  iron: "minerai de fer", coal: "charbon", water: "eau", ironPlate: "lingots de fer",
  steel: "acier", copper: "cuivre", copperWire: "fils de cuivre", circuit: "circuits"
};

const resourceDisplay: {type: ResourcesType; label: string; icon: string}[] = [
  {type: "iron", label: "Fer", icon: "ore.ironOre"},
  {type: "coal", label: "Charbon", icon: "ore.coalOre"},
  {type: "water", label: "Eau", icon: "ore.waterOre"},
  {type: "ironPlate", label: "Lingots", icon: "ore.ironPlate"},
  {type: "steel", label: "Acier", icon: "ore.steel"},
  {type: "copper", label: "Cuivre", icon: "ore.copperOre"},
  {type: "copperWire", label: "Fils", icon: "ore.copperWire"},
  {type: "circuit", label: "Circuits", icon: "ore.circuit"}
];

export function CampaignHud({onRestart}: {onRestart: () => void}) {
  const campaign = useWorldSelector(world => world.campaign);
  const stored = useWorldSelector(world => world.resources);
  const [dismissedLevel, setDismissedLevel] = useState<string | null>(null);
  const definition = CAMPAIGN_LEVELS.find(level => level.id === campaign.activeLevelId) ?? CAMPAIGN_LEVELS[0];
  const progress = campaign.levels.find(level => level.id === definition.id)!;
  const value = objectiveValue(campaign.statistics, stored, definition);
  const next = CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.indexOf(definition) + 1];
  const pollutionRatio = Math.min(1, campaign.pollution / campaign.pollutionLimit);
  const showResult = campaign.status === "playing" && progress.status === "completed" && dismissedLevel !== definition.id;

  return <>
    <section className="campaign-hud" aria-label="Progression de la campagne">
      <nav className="level-tabs" aria-label="Îles">
        {CAMPAIGN_LEVELS.map((level, index) => {
          const state = campaign.levels.find(item => item.id === level.id)!;
          return <button key={level.id} disabled={state.status === "locked"} className={level.id === definition.id ? "selected" : ""}
            title={`${level.name} — ${state.status}`} onClick={() => activateLevel(level.id)}>
            {state.status === "locked" ? "🔒" : state.status === "finalized" ? "✓" : index + 1}
          </button>;
        })}
      </nav>
      <div className="level-heading">
        <span>NIVEAU {CAMPAIGN_LEVELS.indexOf(definition) + 1}</span>
        <strong>{definition.name}</strong>
        {progress.status === "completed" && <button onClick={() => finalizeLevel(definition.id)}>Finaliser</button>}
      </div>
      <div className="objective-progress">
        <span>Exporter {definition.objective.amount} {resourceNames[definition.objective.resource]}</span>
        <strong>{Math.min(value, definition.objective.amount)} / {definition.objective.amount}</strong>
        <div><i style={{width: `${Math.min(100, value / definition.objective.amount * 100)}%`}} /></div>
      </div>
      <div className={`pollution-meter ${pollutionRatio > 0.75 ? "danger" : ""}`}>
        <span>Pollution globale</span>
        <strong>{Math.floor(campaign.pollution)} / {campaign.pollutionLimit}</strong>
        <div><i style={{width: `${pollutionRatio * 100}%`}} /></div>
        {campaign.pollution > 0 && <small>Absorption naturelle : −0,02 par tick</small>}
      </div>
      <div className="campaign-resources" aria-label="Ressources stockées">
        {resourceDisplay.map(resource => {
          const amount = stored[resource.type] ?? 0;
          return <div key={resource.type} className={`campaign-resource ${resource.type}`}
            aria-label={`${resource.label} : ${amount}`} title={resource.label}>
            <span className={`resource-icon ${resource.type}`}
              style={{backgroundImage: `url(${assetManager.getImage(resource.icon).src})`}} />
            <span className="campaign-resource-value"><small>{resource.label}</small><strong>{amount}</strong></span>
          </div>;
        })}
      </div>
    </section>

    {showResult && <div className="level-result-backdrop">
      <section className="level-result" role="dialog" aria-modal="true" aria-labelledby="level-result-title">
        <span className="menu-kicker">OBJECTIF ACCOMPLI</span>
        <h2 id="level-result-title">{definition.name}</h2>
        <div className="level-score">
          <div><span>Temps</span><strong>{progress.completedAt ?? 0} ticks</strong></div>
          <div><span>Pollution de l’île</span><strong>{Math.floor(progress.pollution)}</strong></div>
        </div>
        <p>Tu peux encore améliorer cette usine, ou la finaliser pour verrouiller sa configuration.</p>
        <div className="level-result-actions">
          <button className="text-button" onClick={() => setDismissedLevel(definition.id)}>Continuer à optimiser</button>
          <button className="secondary-button" onClick={() => { finalizeLevel(definition.id); setDismissedLevel(definition.id); }}>Finaliser l’île</button>
          {next && <button className="primary-button" onClick={() => { activateLevel(next.id); setDismissedLevel(definition.id); }}>
            Explorer l’île suivante
          </button>}
        </div>
      </section>
    </div>}

    {campaign.status === "game-over" && <div className="level-result-backdrop">
      <section className="level-result game-over" role="alertdialog">
        <span className="menu-kicker">SEUIL CRITIQUE ATTEINT</span>
        <h2>Écosystème effondré</h2>
        <p>La pollution globale a dépassé {campaign.pollutionLimit}. Cette campagne est terminée.</p>
        <div className="level-result-actions">
          <button className="primary-button" onClick={onRestart}>Recommencer une campagne</button>
        </div>
      </section>
    </div>}
    {campaign.status === "finished" && <div className="level-result-backdrop">
      <section className="level-result victory" role="dialog" aria-modal="true">
        <span className="menu-kicker">ARCHIPEL TERMINÉ</span>
        <h2>Campagne accomplie</h2>
        <div className="level-score">
          <div><span>Temps total</span><strong>{campaign.levels.at(-1)?.completedAt ?? 0} ticks</strong></div>
          <div><span>Pollution totale</span><strong>{Math.floor(campaign.pollution)} / {campaign.pollutionLimit}</strong></div>
        </div>
        <p>Les trois chaînes de production sont opérationnelles. Ton score combine maintenant rapidité et respect de l’archipel.</p>
      </section>
    </div>}
  </>;
}
