import './App.scss'
import {useEffect, useState} from "react";
import {startGame} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";
import {loadGameAssets} from "@web/render/manager/AssetManager.ts";
import {useAppSelector} from "@web/store/hooks.ts";
import {selectCurentTool} from "@web/store/selectors.ts";

async function boot() {
  await loadGameAssets();
  startGame();
}

function App() {
  const [isGameBooting, setIsGameBooting] = useState<boolean>(true)
    const currentTool = useAppSelector(selectCurentTool)
    useEffect(() => {
        boot().then(() => {
          setIsGameBooting(false)
        })
    }, []);

  const gameViewClass = (): string => {
      let styles: string[] = [];
      if (currentTool === "destroy") styles.push("destroy")

      return styles.join(" ")
  }

    if (isGameBooting) return <div>Loading...</div>;

  return (
    <div className={gameViewClass()}>
        <Hud />
        <GameCanvas width={800} height={608} cellSize={config.CELL_SIZE} />
    </div>
  )
}

export default App