import "./hud.scss";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {useWorldSelector} from "@web/game/worldStore.ts";
import {selectCurentTool, selectGamePaused, selectSelectedItem} from "@web/store/selectors.ts";
import type {SelectedItem} from "@engine/api/types.ts";
import {setSelectedItem, setToolMode, togglePause} from "@web/store/controlSlice.ts"; // à créer dans le slice
import {formatTicks} from "@web/utils/utils.ts";
import {pauseGame, startGame} from "@web/game/GameController.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";


export function Hud() {
  const iron = useWorldSelector((world) => world.resources.iron);
  const water = useWorldSelector((world) => world.resources.water);
  const coal = useWorldSelector((world) => world.resources.coal);
  const ironPlate = useWorldSelector((world) => world.resources.ironPlate);
  const tick = useWorldSelector((world) => world.tick);
  const selectedItem = useAppSelector(selectSelectedItem);
  const paused = useAppSelector(selectGamePaused);
  const dispatch = useAppDispatch();
  const currentTool = useAppSelector(selectCurentTool);

  
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
    {type: "ironPlate", value: ironPlate, icon: "ore.ironPlate"}
  ] as const;
  
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
          <button id="hud_pause_btn" onClick={toggleGamePause}>
            {paused ? "▶" : "⏸"}
          </button>
          <span id="hud_tick" className={paused ? "paused" : ""}>
            ⏱ {formatTicks(tick, "short")}
          </span>
        </div>
      </div>
    
    <div id="hud_commands">
      <div id="hud_commands_extractor">
        <button aria-label="Mineur" title="Mineur — fer ou charbon" className={buttonMachineStyle("miner")} onClick={() => handleClick("miner")}>
          <img src={assetManager.getImage("machine.miner.miner2.idle").src} alt=""/>
        </button>
        <button className={buttonMachineStyle("water-pump")} onClick={() => handleClick("water-pump")}>
          <img src={assetManager.getImage("machine.pump.water.idle").src}/>
        </button>
        <button aria-label="Fonderie de fer" title="Fonderie de fer — minerai vers lingot" className={buttonMachineStyle("iron-smelter")} onClick={() => handleClick("iron-smelter")}>
          <span className="automation-machine-icon" style={{backgroundImage: `url(${assetManager.getImage("machine.automation.ironSmelter.idle").src})`}} />
        </button>
      </div>
      <div id="hud_commands_logistique">
        {(["merger", "splitter"] as const).map(type => <button key={type}
          aria-label={type === "merger" ? "Merger" : "Splitter"}
          title={type === "merger" ? "Merger — 3 entrées, 1 sortie" : "Splitter — 1 entrée, 3 sorties"}
          className={buttonMachineStyle(type)} onClick={() => handleClick(type)}>
          <span className={`router-icon ${type}`} style={{backgroundImage: `url(${assetManager.getImage(`router.${type}`).src})`}} />
        </button>)}
        <button aria-label="Tapis roulant" className={buttonMachineStyle("conveyor")} onClick={() => handleClick("conveyor")}>
          <img src={assetManager.getImage("conveyor.right").src} />
        </button>
        <button className={buttonMachineStyle("storage")} onClick={() => handleClick("storage")}>
          <img src={assetManager.getImage("storage.crate").src} width={32} height={32}/>
        </button>
        <button className={destroyButtonClass()} onClick={toggleDestroyMode}>X</button>
      </div>
    </div>
  </div>);
}