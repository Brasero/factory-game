import './App.scss'
import {useEffect, useState} from "react";
import {startGame, pauseGame} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";
import {loadGameAssets} from "@web/render/manager/AssetManager.ts";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {selectCurentTool} from "@web/store/selectors.ts";
import {setPaused} from "@web/store/controlSlice.ts";
import {GameMenu} from "@web/ui/GameMenu.tsx";
import {Tutorial} from "@web/ui/Tutorial.tsx";

type AppScreen = "main" | "game" | "pause";

function App() {
  const [isGameBooting, setIsGameBooting] = useState<boolean>(true)
    const [bootError, setBootError] = useState<string | null>(null);
    const [size, setSize] = useState({width: window.innerWidth - 20, height: window.innerHeight - 18});
    const [screen, setScreen] = useState<AppScreen>("main");
    const [hasStarted, setHasStarted] = useState(false);
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);
    const currentTool = useAppSelector(selectCurentTool)
    const dispatch = useAppDispatch();
    useEffect(() => {
        let cancelled = false;
        loadGameAssets().then(() => {
          if (cancelled) return;
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

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || tutorialStep !== null || !hasStarted) return;
        if (screen === "game") {
          pauseGame();
          dispatch(setPaused(true));
          setScreen("pause");
        } else if (screen === "pause") {
          startGame();
          dispatch(setPaused(false));
          setScreen("game");
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [dispatch, hasStarted, screen, tutorialStep]);

    const play = () => {
      setHasStarted(true);
      setScreen("game");
      dispatch(setPaused(false));
      startGame();
    };
    const openTutorial = () => {
      play();
      setTutorialStep(0);
    };
    const openMainMenu = () => {
      pauseGame();
      dispatch(setPaused(true));
      setTutorialStep(null);
      setScreen("main");
    };

  const gameViewClass = (): string => {
      const styles: string[] = ["gameView"];
      if (currentTool === "destroy") styles.push("destroy")

      return styles.join(" ")
  }

    if (bootError) return <div role="alert">{bootError}</div>;
    if (isGameBooting) return <div>Loading...</div>;

  return <div className={gameViewClass()}>
    {hasStarted && <>
      <Hud />
      <GameCanvas width={size.width} height={size.height} cellSize={config.CELL_SIZE} />
    </>}
    {screen === "main" && <GameMenu mode="main" onPlay={play} onTutorial={openTutorial} />}
    {screen === "pause" && <GameMenu mode="pause" onPlay={play} onTutorial={() => {
      play();
      setTutorialStep(0);
    }} onMainMenu={openMainMenu} />}
    {tutorialStep !== null && <Tutorial step={tutorialStep} onStepChange={setTutorialStep}
      onClose={() => setTutorialStep(null)} />}
  </div>
}

export default App
