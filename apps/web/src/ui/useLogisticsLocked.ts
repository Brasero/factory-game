import {campaignLevelAt} from "@engine/config/campaignConfig";
import {useWorldSelector} from "@web/game/worldStore";

export function useLogisticsLocked(entity: {x: number; y: number}) {
  const campaign = useWorldSelector(world => world.campaign);
  const id = campaignLevelAt(entity.x, entity.y)?.id ?? campaign.activeLevelId;
  const status = campaign.levels.find(level => level.id === id)?.status;
  return campaign.status !== "playing" || !status || status === "locked" || status === "finalized";
}

