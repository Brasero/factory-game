import {useState} from "react";
import {useWorldSnapshot, useWorldSelector} from "@web/game/worldStore";
import {CAMPAIGN_LEVELS, objectiveValue} from "@engine/config/campaignConfig";
import {activateLevel, finalizeLevel} from "@web/game/GameController";
import {assetManager} from "@web/render/manager/AssetManager";
import type {ResourcesType} from "@engine/models/Resources";

import {CampaignOverview} from "./CampaignOverview";

const resourceNames: Record<string, string> = {
  iron: "minerai de fer", coal: "charbon", water: "eau", ironPlate: "lingots de fer",
  steel: "acier", copper: "cuivre", copperWire: "fils de cuivre", circuit: "circuits",
  uranium: "uranium", uraniumCell: "cellules d’uranium", processingUnit: "unités de calcul",
  automationCore: "cœurs d’automatisation"
};

const resourceDisplay: {type: ResourcesType; label: string; icon: string}[] = [
  {type: "iron", label: "Fer", icon: "ore.ironOre"},
  {type: "coal", label: "Charbon", icon: "ore.coalOre"},
  {type: "water", label: "Eau", icon: "ore.waterOre"},
  {type: "ironPlate", label: "Lingots", icon: "ore.ironPlate"},
  {type: "steel", label: "Acier", icon: "ore.steel"},
  {type: "copper", label: "Cuivre", icon: "ore.copperOre"},
  {type: "copperWire", label: "Fils", icon: "ore.copperWire"},
  {type: "circuit", label: "Circuits", icon: "ore.circuit"},
  {type: "uranium", label: "Uranium", icon: "ore.uraniumOre"},
  {type: "uraniumCell", label: "Cellules", icon: "ore.uraniumCell"},
  {type: "processingUnit", label: "Calcul", icon: "ore.processingUnit"},
  {type: "automationCore", label: "Cœurs", icon: "ore.automationCore"}
];

export function CampaignHud({onRestart, onContinue, onMainMenu}: {
  onRestart: () => void;
  onContinue: () => void;
  onMainMenu: () => void;
}) {
  const campaign = useWorldSelector(world => world.campaign);
  const unlockedResources = new Set(CAMPAIGN_LEVELS.filter(level => {
    const progress = campaign.levels.find(item => item.id === level.id);
    return progress && progress.status !== "locked";
  }).flatMap(level => level.unlocks.resources));
  const stored = useWorldSelector(world => world.resources);
  const [dismissedLevel, setDismissedLevel] = useState<string | null>(null);
  const definition = CAMPAIGN_LEVELS.find(level => level.id === campaign.activeLevelId) ?? CAMPAIGN_LEVELS[0];
  const progress = campaign.levels.find(level => level.id === definition.id)!;
  const world = useWorldSnapshot();
  const advanced = !!(definition.objective.rate || definition.objective.requirements || definition.objective.emissionBudget !== undefined);
  const value = advanced ? progress.objectiveProgress?.value ?? 0 : objectiveValue(campaign.statistics, stored, definition);
  const next = CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.indexOf(definition) + 1];
  const pollutionRatio = Math.min(1, campaign.pollution / campaign.pollutionLimit);
  const showResult = campaign.status === "playing" && progress.status === "completed" && dismissedLevel !== definition.id;

  return <>
    <CampaignOverview world={world}/>
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
        {progress.status === "completed" && <button onClick={() => setDismissedLevel(null)}>Finaliser…</button>}
      </div>
      <div className="objective-progress" data-tutorial="campaign-objective">
        <span>Exporter {definition.objective.amount} {resourceNames[definition.objective.resource]}</span>
        <strong>{Math.min(value, definition.objective.amount)} / {definition.objective.amount}</strong>
        <div><i style={{width: `${Math.min(100, value / definition.objective.amount * 100)}%`}} /></div>
      </div>
      {definition.objective.requirements && <small className="objective-detail">Livraison composée : {Object.entries(definition.objective.requirements).map(([resource, amount]) => `${amount} ${resourceNames[resource]}`).join(" + ")}</small>}
      {definition.objective.rate && <small className="objective-detail">Débit requis : {definition.objective.rate.amount} / 10 s · Maintien : {((progress.objectiveProgress?.sustained ?? 0) / 10).toFixed(1)} / 10 s</small>}
      {definition.objective.emissionBudget !== undefined && <small className="objective-detail">Émissions de l’essai : {Math.floor(progress.pollution - (progress.objectiveProgress?.emissions ?? progress.pollution))} / {definition.objective.emissionBudget}. Dépassement : nouvel essai automatique.</small>}
      <div className={`pollution-meter ${pollutionRatio > 0.75 ? "danger" : ""}`} data-tutorial="campaign-pollution">
        <span>Pollution globale</span>
        <strong>{Math.floor(campaign.pollution)} / {campaign.pollutionLimit}</strong>
        <div><i style={{width: `${pollutionRatio * 100}%`}} /></div>
        <small>Absorption naturelle : −0,02 par tick</small>
      </div>
      <div className="campaign-resources" aria-label="Ressources stockées">
        <div className="campaign-resource construction-material" data-tutorial="construction-materials"
          aria-label={`Matériaux de construction : ${campaign.constructionMaterials}`}
          title="Matériaux de construction">
          <span className="construction-material-icon" aria-hidden="true">🧱</span>
          <span className="campaign-resource-value"><small>Construction</small><strong>{campaign.constructionMaterials}</strong></span>
        </div>
        {resourceDisplay.filter(resource => unlockedResources.has(resource.type)).map(resource => {
          const amount = stored[resource.type] ?? 0;
          return <div key={resource.type} className={`campaign-resource ${resource.type}`}
            aria-label={`${resource.label} : ${amount}`} title={resource.label}>
            <img className={`resource-icon ${resource.type}`}
              src={assetManager.getImage(resource.icon).src} alt="" />
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
        <p>Tu peux encore améliorer cette usine avant de passer à la suite.</p>
        <div className="finalization-warning" role="alert">
          <strong>⚠ VERROUILLAGE DÉFINITIF</strong>
          <span>Finaliser cette île empêchera définitivement toute construction, destruction ou modification dessus.</span>
        </div>
        <div className="level-result-actions">
          <button className="text-button" onClick={() => setDismissedLevel(definition.id)}>Continuer à optimiser</button>
          <button className="secondary-button finalization-button" onClick={() => { finalizeLevel(definition.id); setDismissedLevel(definition.id); }}>
            Finaliser et verrouiller définitivement
          </button>
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
        <p>Les six chaînes de production sont opérationnelles. Ton score combine maintenant rapidité et respect de l’archipel.</p>
        <div className="level-result-actions">
          <button className="primary-button" onClick={onContinue}>Continuer à jouer</button>
          <button className="secondary-button" onClick={onRestart}>Relancer une campagne</button>
          <button className="text-button" onClick={onMainMenu}>Revenir au menu principal</button>
        </div>
      </section>
    </div>}
  </>;
}
