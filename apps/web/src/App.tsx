import './App.scss'
import {useEffect} from "react";
import {startGame} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";

function App() {

    useEffect(() => {
        startGame();
    }, []);

    

  return (
    <div>
        <Hud />
        <GameCanvas width={800} height={600} cellSize={40} />
    </div>
  )
}

export default App