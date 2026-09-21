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
import type {MachineType, MachineVariant} from "@engine/models/Machine";


export function Hud() {
  const iron = useWorldSelector((world) => world.resources.iron);
  const water = useWorldSelector((world) => world.resources.water);
  const coal = useWorldSelector((world) => world.resources.coal);
  const ironPlate = useWorldSelector((world) => world.resources.ironPlate);
  const steel = useWorldSelector((world) => world.resources.steel ?? 0);
  const copper = useWorldSelector((world) => world.resources.copper ?? 0);
  const copperWire = useWorldSelector((world) => world.resources.copperWire ?? 0);
  const circuit = useWorldSelector((world) => world.resources.circuit ?? 0);
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
  const resources = [
    {type: "iron", value: iron, icon: "ore.ironOre"},
    {type: "coal", value: coal, icon: "ore.coalOre"},
    {type: "water", value: water, icon: "ore.waterOre"},
    {type: "ironPlate", value: ironPlate, icon: "ore.ironPlate"},
    {type: "steel", value: steel, icon: "ore.ironPlate"},
    {type: "copper", value: copper, icon: "ore.copperOre"},
    {type: "copperWire", value: copperWire, icon: "ore.ironPlate"},
    {type: "circuit", value: circuit, icon: "ore.ironPlate"}
  ] as const;
  const processorButtons: {type: MachineType; label: string; title: string}[] = [
    {type: "wire-mill", label: "Fil", title: "Tréfilerie — cuivre vers fil de cuivre"},
    {type: "assembler", label: "Circuit", title: "Assembleur — lingot et fil vers circuit"}
  ];
  
  return (<div id="hud_container">
      <div id="hud_info">
        {resources.some(resource => resource.value > 0) && <div id="hud_resources">
          {resources.filter(resource => resource.value > 0).map(resource => (
            <div key={resource.type} className={`hud_resource ${resource.type} ${!paused ? 'pulse' : ''}`}>
              <span className={`resource-icon ${resource.type}`} style={{backgroundImage: `url(${assetManager.getImage(resource.icon).src})`}} />
              {resource.value}
            </div>
          ))}
        </div>}
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
        {processorButtons.filter(button => unlockedMachines.has(button.type)).map(button => <button key={button.type}
          aria-label={button.label} title={button.title} className={buttonMachineStyle(button.type)} onClick={() => handleClick(button.type)}>
          <span className="processor-label">{button.label}</span>
        </button>)}
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
