import './App.scss'
import {useEffect, useState} from "react";
import {continueCampaign, getCurrentSnapshot, hasSavedGame, startGame, pauseGame, startNewCampaign} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";
import {loadGameAssets} from "@web/render/manager/AssetManager.ts";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {selectCurentTool} from "@web/store/selectors.ts";
import {setPaused, setSelectedItem, setSelectedVariant, setToolMode} from "@web/store/controlSlice.ts";
import {GameMenu} from "@web/ui/GameMenu.tsx";
import {Tutorial} from "@web/ui/Tutorial.tsx";
import {CampaignHud} from "@web/ui/CampaignHud.tsx";
import {useWorldSelector} from "@web/game/worldStore.ts";
import {tutorialSequences, type TutorialSequenceId} from "@web/ui/tutorialSteps.ts";

type AppScreen = "main" | "game" | "pause";

function App() {
  const [isGameBooting, setIsGameBooting] = useState<boolean>(true)
    const [bootError, setBootError] = useState<string | null>(null);
    const [size, setSize] = useState({width: window.innerWidth - 20, height: window.innerHeight - 18});
    const [screen, setScreen] = useState<AppScreen>("main");
    const [hasStarted, setHasStarted] = useState(false);
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);
    const [tutorialSequence, setTutorialSequence] = useState<TutorialSequenceId>("basics");
    const [shownTutorials, setShownTutorials] = useState<Set<TutorialSequenceId>>(() => new Set());
    const [hasSave, setHasSave] = useState(hasSavedGame());
    const currentTool = useAppSelector(selectCurentTool)
    const campaignLevels = useWorldSelector(world => world.campaign.levels);
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

    useEffect(() => {
      if (!hasStarted || screen !== "game" || tutorialStep !== null) return;
      const unlocked = (id: string) => campaignLevels.find(level => level.id === id)?.status !== "locked";
      const next: TutorialSequenceId | undefined = unlocked("level-2") && !shownTutorials.has("level-2") ? "level-2"
        : unlocked("level-3") && !shownTutorials.has("level-3") ? "level-3" : undefined;
      if (!next) return;
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        setShownTutorials(previous => new Set(previous).add(next));
        setTutorialSequence(next);
        setTutorialStep(0);
      });
      return () => { cancelled = true; };
    }, [campaignLevels, hasStarted, screen, shownTutorials, tutorialStep]);

    const play = () => {
      setHasStarted(true);
      setScreen("game");
      dispatch(setPaused(false));
      startGame();
    };
    const openTutorial = () => {
      play();
      setTutorialSequence("basics");
      setShownTutorials(previous => new Set(previous).add("basics"));
      setTutorialStep(0);
    };
    const newCampaign = () => {
      startNewCampaign();
      dispatch(setSelectedItem(""));
      dispatch(setSelectedVariant("standard"));
      dispatch(setToolMode("build"));
      setHasSave(false);
      play();
      setShownTutorials(new Set(["basics"]));
      setTutorialSequence("basics");
      setTutorialStep(0);
    };
    const restartCampaign = () => {
      startNewCampaign();
      dispatch(setSelectedItem(""));
      dispatch(setSelectedVariant("standard"));
      dispatch(setToolMode("build"));
      setHasSave(false);
      setTutorialStep(null);
      play();
    };
    const continueFinishedCampaign = () => {
      if (!continueCampaign()) return;
      dispatch(setPaused(false));
      startGame();
    };
    const openMainMenu = () => {
      pauseGame();
      setHasSave(true);
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
      <CampaignHud onRestart={restartCampaign} onContinue={continueFinishedCampaign} onMainMenu={openMainMenu} />
      <GameCanvas width={size.width} height={size.height} cellSize={config.CELL_SIZE} />
    </>}
    {screen === "main" && <GameMenu mode="main" hasSave={hasSave} backgroundWorld={getCurrentSnapshot()}
      savePreview={hasSave ? getCurrentSnapshot() : undefined}
      onPlay={play} onNewCampaign={newCampaign} onTutorial={openTutorial} />}
    {screen === "pause" && <GameMenu mode="pause" onPlay={play} onTutorial={() => {
      play();
      setTutorialSequence("basics");
      setShownTutorials(previous => new Set(previous).add("basics"));
      setTutorialStep(0);
    }} onMainMenu={openMainMenu} />}
    {tutorialStep !== null && <Tutorial step={tutorialStep} steps={tutorialSequences[tutorialSequence]} onStepChange={setTutorialStep}
      onClose={() => setTutorialStep(null)} />}
  </div>
}

export default App
