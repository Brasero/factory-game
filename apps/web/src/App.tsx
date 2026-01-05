import './App.scss'
import {useEffect} from "react";
import {startGame} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";
import {conveyorAssetManager} from "@web/render/ConveyorAssetManager.ts";

async function boot() {
  await conveyorAssetManager.loadAll();
  startGame();
}

function App() {

    useEffect(() => {
        boot()
    }, []);

    

  return (
    <div>
        <Hud />
        <GameCanvas width={800} height={608} cellSize={config.CELL_SIZE} />
    </div>
  )
}

export default App