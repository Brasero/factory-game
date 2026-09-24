import "./hud.scss";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {useWorldSelector} from "@web/game/worldStore.ts";
import {selectCurentTool, selectGamePaused, selectSelectedItem, selectSelectedVariant} from "@web/store/selectors.ts";
import type {SelectedItem} from "@engine/api/types.ts";
import {setSelectedItem, setSelectedVariant, setToolMode, togglePause} from "@web/store/controlSlice.ts";
import {formatTicks} from "@web/utils/utils.ts";
import {pauseGame, startGame} from "@web/game/GameController.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import type {MachineVariant} from "@engine/models/Machine";


export function Hud() {
  const tick = useWorldSelector((world) => world.tick);
  const selectedItem = useAppSelector(selectSelectedItem);
  const paused = useAppSelector(selectGamePaused);
  const dispatch = useAppDispatch();
  const currentTool = useAppSelector(selectCurentTool);
  const selectedVariant = useAppSelector(selectSelectedVariant);
  const campaignLevels = useWorldSelector(world => world.campaign.levels);
  const unlockedDefinitions = CAMPAIGN_LEVELS.filter(level => campaignLevels.find(progress => progress.id === level.id)?.status !== "locked");
  const unlockedMachines = new Set(unlockedDefinitions.flatMap(level => level.unlocks.machines));
  const unlockedVariants = new Set(unlockedDefinitions.flatMap(level => level.unlocks.variants));

  
  const handleClick = (item: SelectedItem) => {
    if (currentTool !== "build") return
    if (selectedItem === item) {
      dispatch(setSelectedItem(""));
      return;
    }
    dispatch(setSelectedItem(item));
  };
  const toggleGamePause = () => {
    const isPaused = !!paused;
    dispatch(togglePause());
    if (isPaused) {
      startGame();
      return;
    }
    pauseGame();
  };

  const toggleDestroyMode = () => {
    const newTool = currentTool === "build" ? "destroy" : "build";
    dispatch(setToolMode(newTool))
    dispatch(setSelectedItem(""));

  }
  
  const buttonMachineStyle = (item: SelectedItem) => {
    let style = "extractor";
    if (item === selectedItem) style += " selected";
    return style + " " + item;
  };

  const destroyButtonClass = () => {
    return "destroyBtn " + (currentTool === "destroy" ? "selected" : "")
  }
  return (<div id="hud_container">
      <div id="hud_info">
        <div id="hud_tick_container">
          <button id="hud_pause_btn" data-tutorial="pause" aria-label={paused ? "Reprendre la simulation" : "Mettre la simulation en pause"} onClick={toggleGamePause}>
            {paused ? "▶" : "⏸"}
          </button>
          <span id="hud_tick" className={paused ? "paused" : ""}>
            ⏱ {formatTicks(tick, "short")}
          </span>
        </div>
      </div>
    
    <div id="hud_commands">
      <div id="hud_commands_extractor">
        <button data-tutorial="miner" aria-label="Mineur" title="Mineur — fer ou charbon" className={buttonMachineStyle("miner")} onClick={() => handleClick("miner")}>
          <img src={assetManager.getImage("machine.miner.miner2.idle").src} alt=""/>
        </button>
        <button data-tutorial="water-pump" aria-label="Pompe à eau" className={buttonMachineStyle("water-pump")} onClick={() => handleClick("water-pump")}>
          <img src={assetManager.getImage("machine.pump.water.idle").src} alt=""/>
        </button>
        <button data-tutorial="iron-smelter" aria-label="Fonderie" title="Fonderie — sélectionne sa recette après placement" className={buttonMachineStyle("iron-smelter")} onClick={() => handleClick("iron-smelter")}>
          <span className="automation-machine-icon" style={{backgroundImage: `url(${assetManager.getImage("machine.automation.ironSmelter.idle").src})`}} />
        </button>
        {unlockedMachines.has("assembler") && <button aria-label="Machine de production"
          title="Machine de production — sélectionne Fil de cuivre ou Circuit après placement"
          className={buttonMachineStyle("assembler")} onClick={() => handleClick("assembler")}>
          <img className="processor-machine-icon"
            src={assetManager.getImage(`machine.automation.assembler.${selectedVariant}.idle`).src} alt="" />
          </button>}
        {unlockedMachines.has("boiler") && <button aria-label="Boiler dépolluant"
          title="Boiler — consomme de l’eau pour réduire rapidement la pollution"
          className={buttonMachineStyle("boiler")} onClick={() => handleClick("boiler")}>
          <img className="processor-machine-icon"
            src={assetManager.getImage("machine.automation.boiler.idle").src} alt="" />
        </button>}
      </div>
      <div id="hud_commands_logistique">
        {(["merger", "splitter"] as const).map(type => <button key={type} data-tutorial={type}
          aria-label={type === "merger" ? "Merger" : "Splitter"}
          title={type === "merger" ? "Merger — 3 entrées, 1 sortie" : "Splitter — 1 entrée, 3 sorties"}
          className={buttonMachineStyle(type)} onClick={() => handleClick(type)}>
          <span className={`router-icon ${type}`} style={{backgroundImage: `url(${assetManager.getImage(`router.${type}`).src})`}} />
        </button>)}
        <button data-tutorial="conveyor" aria-label="Tapis roulant" className={buttonMachineStyle("conveyor")} onClick={() => handleClick("conveyor")}>
          <img src={assetManager.getImage("conveyor.right").src} alt="" />
        </button>
        <button data-tutorial="storage" aria-label="Coffre" className={buttonMachineStyle("storage")} onClick={() => handleClick("storage")}>
          <img src={assetManager.getImage("storage.crate").src} width={32} height={32} alt=""/>
        </button>
        <button data-tutorial="destroy" aria-label="Mode destruction" className={destroyButtonClass()} onClick={toggleDestroyMode}>X</button>
      </div>
      {selectedItem && !["conveyor", "splitter", "merger", "storage"].includes(selectedItem) && <div className="machine-variants" aria-label="Version de la machine">
        {(["eco", "standard", "industrial"] as MachineVariant[]).filter(variant => unlockedVariants.has(variant)).map(variant =>
          <button key={variant} className={selectedVariant === variant ? "selected" : ""} onClick={() => dispatch(setSelectedVariant(variant))}>
            {variant === "eco" ? "Éco" : variant === "industrial" ? "Indus." : "Standard"}
          </button>)}
      </div>}
    </div>
  </div>);
}
