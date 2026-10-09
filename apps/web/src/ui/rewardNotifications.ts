import {useEffect, useEffectEvent, useRef, useState} from "react";
import type {CampaignState} from "@engine/models/Campaign";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {CONTRACTS} from "@engine/config/contractConfig";
import {LEVEL_CONSTRUCTION_REWARD} from "@engine/config/constructionConfig";

export type RewardNotice = {id: string; kind: string; title: string; detail: string; reward: number};
export function completedRewards(campaign: CampaignState): RewardNotice[] {
  const rewards: RewardNotice[] = [];
  for (const definition of CAMPAIGN_LEVELS) {
    const level = campaign.levels.find(item => item.id === definition.id);
    if (level?.completedAt !== undefined) rewards.push({id: `${level.id}:objective:${level.completedAt}`, kind: "OBJECTIF ACCOMPLI", title: definition.name,
      detail: "Ton usine a rempli l’objectif principal.", reward: LEVEL_CONSTRUCTION_REWARD});
    if (level?.status === "finalized" && level.finalizationReward !== undefined) rewards.push({
      id: `${level.id}:finalization:${level.finalizedAt}`, kind: "USINE MISE EN SERVICE", title: definition.name,
      detail: "Émissions de cette île réduites de 10 % de façon permanente.", reward: level.finalizationReward});
    for (const challenge of definition.challenges ?? []) {
      const state = level?.challenges?.[challenge.id];
      if (state?.completedAt !== undefined) rewards.push({id: `${definition.id}:${challenge.id}:${state.completedAt}`, kind: "DÉFI RÉUSSI", title: challenge.name,
        detail: definition.name, reward: challenge.reward});
    }
  }
  for (const contract of CONTRACTS) {
    const progress = campaign.contracts?.[contract.id];
    if (progress?.status === "completed") rewards.push({id: `contract:${contract.id}:${progress.endedAt}`, kind: "CONTRAT LIVRÉ", title: contract.name,
      detail: contract.restoration ? `Absorption permanente : +${(contract.restoration.absorptionBonus * 10).toLocaleString("fr-FR")} / s · ${contract.distinction}`
        : `Distinction obtenue : ${contract.distinction}`, reward: contract.reward});
  }
  return rewards;
}

export function useRewardNotifications(campaign: CampaignState) {
  const known = useRef<Set<string> | null>(null);
  const [notices, setNotices] = useState<RewardNotice[]>([]);
  const [gain, setGain] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const observeRewards = useEffectEvent((nextCampaign: CampaignState) => {
    const rewards = completedRewards(nextCampaign);
    const current = new Set(rewards.map(reward => reward.id));
    if (known.current && [...known.current].some(id => !current.has(id))) {
      timers.current.forEach(clearTimeout); timers.current = [];
      setNotices(previous => previous.length ? [] : previous);
      setGain(previous => previous ? 0 : previous);
      known.current = current;
      return;
    }
    const added = rewards.filter(reward => !known.current?.has(reward.id));
    if (known.current && added.length) {
      setNotices(previous => [...previous, ...added]);
      setGain(previous => previous + added.reduce((sum, reward) => sum + reward.reward, 0));
      // Le gain et chaque réussite restent visibles huit secondes, même si plusieurs arrivent ensemble.
      timers.current.push(setTimeout(() => {
        setNotices(previous => previous.filter(notice => !added.some(reward => reward.id === notice.id)));
        setGain(previous => Math.max(0, previous - added.reduce((sum, reward) => sum + reward.reward, 0)));
      }, 8000));
    }
    known.current = current;
  });
  useEffect(() => { observeRewards(campaign); }, [campaign]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  return {notices, gain, dismiss: (id: string) => setNotices(previous => previous.filter(notice => notice.id !== id))};
}
