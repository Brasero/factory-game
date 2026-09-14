import './App.scss'
import {useEffect, useState} from "react";
import {startGame, pauseGame} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";
import {loadGameAssets} from "@web/render/manager/AssetManager.ts";
import {useAppSelector} from "@web/store/hooks.ts";
import {selectCurentTool} from "@web/store/selectors.ts";

function App() {
  const [isGameBooting, setIsGameBooting] = useState<boolean>(true)
    const [bootError, setBootError] = useState<string | null>(null);
    const [size, setSize] = useState({width: window.innerWidth - 20, height: window.innerHeight - 18});
    const currentTool = useAppSelector(selectCurentTool)
    useEffect(() => {
        let cancelled = false;
        loadGameAssets().then(() => {
          if (cancelled) return;
          startGame();
          setIsGameBooting(false);
        }).catch(() => {
          if (!cancelled) setBootError("Impossible de charger les images du jeu. Recharge la page pour réessayer.");
        });
        const resize = () => setSize({width: window.innerWidth - 20, height: window.innerHeight - 18});
        window.addEventListener("resize", resize);
        return () => {
          cancelled = true;
          pauseGame();
          window.removeEventListener("resize", resize);
        };
    }, []);

  const gameViewClass = (): string => {
      const styles: string[] = ["gameView"];
      if (currentTool === "destroy") styles.push("destroy")

      return styles.join(" ")
  }

    if (bootError) return <div role="alert">{bootError}</div>;
    if (isGameBooting) return <div>Loading...</div>;

  return (
    <div className={gameViewClass()}>
        <Hud />
        <GameCanvas width={size.width} height={size.height} cellSize={config.CELL_SIZE} />
    </div>
  )
}

export default App