import {contractDefinition} from "@engine/config/contractConfig";
import {useEffect, useRef, useState} from "react";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import type {WorldSnapshot} from "@engine/api/types";
import {machineIdleReason} from "@engine/systems/MachineStatus";
import {campaignLevelAt} from "@engine/config/campaignConfig";

import {islandAbsorption} from "@engine/config/ecologyConfig";
import {resourceLabels} from "./productionFeedback";

export function CampaignOverview({world, expanded, onToggle}: {world: WorldSnapshot; expanded?: boolean; onToggle?: () => void}) {
  const [localOpen, setOpen] = useState(false);
  const open = expanded ?? localOpen;
  const [sound, setSound] = useState(() => localStorage.getItem("factstories-sound") === "true");
  const [reduced, setReduced] = useState(() => localStorage.getItem("factstories-reduced-motion") === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [notice, setNotice] = useState("");
  const known = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    const events = new Set<string>();
    for (const level of world.campaign.levels) {
      if (level.telemetry?.firstExportAt !== undefined) events.add(`${level.id} : première exportation`);
      if (level.status === "completed" || level.status === "finalized") events.add(`${level.id} : objectif accompli`);
      for (const [id, challenge] of Object.entries(level.challenges ?? {})) if (challenge.completedAt !== undefined) events.add(`${level.id} : défi ${id} réussi`);
      if ((level.telemetry?.record ?? 0) > 0) events.add(`${level.id} : record ${level.telemetry!.record} / 10 s`);
    }
    for (const contract of Object.values(world.campaign.contracts ?? {})) {
      if (contract.status === "completed") events.add(`Contrat livré : ${contractDefinition(contract.id)?.name}`);
      if (contract.status === "failed") events.add(`Délai dépassé : ${contractDefinition(contract.id)?.name} · stock libéré`);
    }
    const added = [...events].filter(event => !known.current?.has(event));
    if (known.current && added.length) {
      const passive = added.filter(event => !event.includes("objectif accompli") && !event.includes("défi ") && !event.startsWith("Contrat livré"));
      if (passive.length) setNotice(passive.at(-1)!);
      const ctx = audio.current;
      if (sound && ctx?.state === "running") {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        oscillator.connect(gain); gain.connect(ctx.destination); oscillator.frequency.value = 660;
        gain.gain.setValueAtTime(0.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        oscillator.start(); oscillator.stop(ctx.currentTime + 0.15);
      }
    }
    known.current = events;
  }, [world.campaign.levels, world.campaign.contracts, sound]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const active = world.campaign.levels.find(level => level.id === world.campaign.activeLevelId)!;
  const definition = CAMPAIGN_LEVELS.find(level => level.id === active.id)!;
  return <aside className={`campaign-overview ${reduced ? "reduced-motion" : ""}`}>
    <button data-tutorial="campaign-challenges" onClick={() => onToggle ? onToggle() : setOpen(value => !value)} aria-expanded={open}>Bilan et défis</button>
    {notice && <div role="status" className="production-notice">{notice.replace(/level-(\d+)/, "Île $1")}<button aria-label="Masquer la notification" onClick={() => setNotice("")}>×</button></div>}
    {open && <section aria-label="Bilan de l’archipel">
      <header className="factory-panel-heading"><span className="menu-kicker">CARNET DE PRODUCTION · {definition.name}</span><h3>{definition.character}</h3></header>
      <h4>Défis de l’île</h4>
      <p>Défis facultatifs : +15 matériaux chacun. La suite dépend uniquement de l’objectif principal.</p>
      {(definition.challenges ?? []).map(challenge => {
        const state = active.challenges?.[challenge.id];
        return <div key={challenge.id} className="island-challenge"><strong>{challenge.name} {state?.completedAt !== undefined ? "✓" : ""}</strong><span className="challenge-reward">{state?.completedAt !== undefined ? "Récompense reçue" : "+15 matériaux"}</span>
          <p>{challenge.description}</p><small>{Math.floor(state?.value ?? 0)} / {challenge.objective.amount} {resourceLabels[challenge.objective.resource]}
            {challenge.objective.rate && ` · Débit : ${challenge.objective.rate.amount} / 10 s · Effort : ${((state?.sustained ?? 0) / 10).toFixed(1)} / 10 s`}
            {challenge.objective.emissionBudget !== undefined && ` · Émissions : ${Math.floor(active.pollution - (state?.emissions ?? active.pollution))} / ${challenge.objective.emissionBudget} · Essai ${(state?.attempts ?? 0) + 1}`}</small></div>;
      })}
      <details className="production-summary"><summary>Bilan de l’archipel</summary>
      <div className="production-table"><table><caption>Mesures sur les 10 dernières secondes simulées</caption><thead><tr><th>Île</th><th>Exportations</th><th>Débit</th><th>Émissions</th><th>Absorption / s</th><th>Arrêts</th></tr></thead><tbody>
        {world.campaign.levels.filter(level => level.status !== "locked").map(level => <tr key={level.id}>
          <td>{CAMPAIGN_LEVELS.find(item => item.id === level.id)?.name}</td>
          <td>{Object.values(level.exports ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)}</td>
          <td>{Object.entries(level.telemetry?.rates ?? {}).filter(([, value]) => value).map(([resource, value]) => `${resourceLabels[resource]} : ${((value ?? 0) / 10).toFixed(2)}/s`).join(", ") || "0/s"}</td>
          <td>{level.pollution.toFixed(1)}</td>
          <td>{(islandAbsorption(world.campaign, level.id) * 10).toLocaleString("fr-FR", {maximumFractionDigits: 3})}</td>
          <td>{world.machines.filter(machine => campaignLevelAt(machine.x, machine.y)?.id === level.id && machineIdleReason(machine, world.campaign.pollution)).length}</td>
        </tr>)}
      </tbody></table></div></details>
      <h4>Retours de production</h4>
      <label><input type="checkbox" checked={sound} onChange={event => {const enabled = event.target.checked; setSound(enabled); localStorage.setItem("factstories-sound", String(enabled)); if (enabled) {audio.current ??= new AudioContext(); void audio.current.resume();}}}/> Sons des réussites</label>
      <label><input type="checkbox" checked={reduced} onChange={event => {setReduced(event.target.checked); localStorage.setItem("factstories-reduced-motion", String(event.target.checked));}}/> Réduire les animations de notification</label>
    </section>}
  </aside>;
}
