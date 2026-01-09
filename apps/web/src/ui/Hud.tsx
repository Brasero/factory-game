import "./hud.scss";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {
  selectCoalQuantity, selectCurentTool,
  selectGamePaused,
  selectGameTick,
  selectIronQuantity,
  selectSelectedItem,
  selectWaterQuantity
} from "@web/store/selectors.ts";
import type {SelectedItem} from "@engine/models/Controls.ts";
import {setSelectedItem, setToolMode, togglePause} from "@web/store/controlSlice.ts"; // à créer dans le slice
import {formatTicks} from "@web/utils/utils.ts";
import {pauseGame, startGame} from "@web/game/GameController.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";

export function Hud() {
  const iron = useAppSelector(selectIronQuantity);
  const water = useAppSelector(selectWaterQuantity);
  const coal = useAppSelector(selectCoalQuantity);
  const tick = useAppSelector(selectGameTick);
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
  
  return (<div id="hud_container">
      <div id="hud_info">
        <div id="hud_resources">
          <div className={`hud_resource iron ${(iron > 0 && !paused) ? 'pulse' : ''}`}><img src={assetManager.getImage("ore.ironOre").src} width={16} height={16} /> {iron}</div>
          <div className={`hud_resource coal ${(coal > 0 && !paused) ? 'pulse' : ''}`}><img src={assetManager.getImage("ore.coalOre").src} width={16} height={16}/> {coal}</div>
          <div className={`hud_resource water ${(water > 0 && !paused) ? 'pulse' : ''}`}>💧 {water}</div>
        </div>
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
        <h5>
          <img src={assetManager.getImage("machine.miner.miner2.idle").src} alt=""/>
        </h5>
        <button className={buttonMachineStyle("iron-mine")} onClick={() => handleClick("iron-mine")}><img src={assetManager.getImage("ore.ironOre").src} width={20} height={20} /></button>
        <button className={buttonMachineStyle("coal-mine")} onClick={() => handleClick("coal-mine")}><img src={assetManager.getImage("ore.coalOre").src} width={20} height={20}/></button>
        <button className={buttonMachineStyle("water-pump")} onClick={() => handleClick("water-pump")}>
          <img src={assetManager.getImage("machine.pump.water.idle").src}/>
        </button>
      </div>
      <div id="hud_commands_logistique">
        <button className={buttonMachineStyle("conveyor")} onClick={() => handleClick("conveyor")}>
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