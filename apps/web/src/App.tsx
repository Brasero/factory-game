import './App.scss'
import {useEffect} from "react";
import {startGame} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";

function App() {

    useEffect(() => {
        startGame();
    }, []);

    

  return (
    <div>
        <Hud />
        <GameCanvas width={800} height={608} cellSize={config.CELL_SIZE} />
    </div>
  )
}

export default App