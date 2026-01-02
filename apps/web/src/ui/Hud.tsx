import "./hud.scss";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {
  selectCoalQuantity,
  selectGamePaused,
  selectGameTick,
  selectIronQuantity,
  selectSelectedItem,
  selectWaterQuantity
} from "@web/store/selectors.ts";
import type {SelectedItem} from "@engine/models/Controls.ts";
import {setSelectedItem, togglePause} from "@web/store/controlSlice.ts"; // à créer dans le slice
import {formatTicks} from "@web/utils/utils.ts";
import {pauseGame, startGame} from "@web/game/GameController.ts";

export function Hud() {
  const iron = useAppSelector(selectIronQuantity);
  const water = useAppSelector(selectWaterQuantity);
  const coal = useAppSelector(selectCoalQuantity);
  const tick = useAppSelector(selectGameTick);
  const selectedItem = useAppSelector(selectSelectedItem);
  const paused = useAppSelector(selectGamePaused); // nouveau
  const dispatch = useAppDispatch();
  
  const handleClick = (item: SelectedItem) => {
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
  
  const buttonMachineStyle = (item: SelectedItem) => {
    let style = "extractor";
    if (item === selectedItem) style += " selected";
    return style + " " + item;
  };
  
  return (<div id="hud_container">
      <div id="hud_info">
        <div id="hud_resources">
          <div className={`hud_resource iron ${iron > 0 ? 'pulse' : ''}`}>🪨 {iron}</div>
          <div className={`hud_resource coal ${coal > 0 ? 'pulse' : ''}`}>🔥 {coal}</div>
          <div className={`hud_resource water ${water > 0 ? 'pulse' : ''}`}>💧 {water}</div>
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
          <h5>Extracteur de ressources</h5>
          <button className={buttonMachineStyle("iron-mine")} onClick={() => handleClick("iron-mine")}>🪨 Fer</button>
          <button className={buttonMachineStyle("coal-mine")} onClick={() => handleClick("coal-mine")}>🔥 Charbon
          </button>
          <button className={buttonMachineStyle("water-pump")} onClick={() => handleClick("water-pump")}>💧 Pompe
          </button>
        </div>
      </div>
    </div>);
}