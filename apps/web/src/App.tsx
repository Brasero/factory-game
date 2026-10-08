import './App.scss'
import {useEffect, useRef, useState} from "react";
import {continueCampaign, getCurrentSnapshot, hasSavedGame, startGame, pauseGame, startNewCampaign} from "./game/GameController.ts";
import {Hud} from "./ui/Hud.tsx";
import {GameCanvas} from "@web/render/GameCanvas.tsx";
import {config} from "@web/config/gridConfig.ts";
import {loadGameAssets} from "@web/render/manager/AssetManager.ts";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {selectCurentTool} from "@web/store/selectors.ts";
import {setPaused, setSelectedItem, setSelectedVariant, setToolMode} from "@web/store/controlSlice.ts";
import {GameSettings} from "@web/ui/GameSettings.tsx";
import {GameMenu} from "@web/ui/GameMenu.tsx";
import {Tutorial} from "@web/ui/Tutorial.tsx";
import {CampaignHud} from "@web/ui/CampaignHud.tsx";
import {useWorldSelector} from "@web/game/worldStore.ts";
import {tutorialSequences, type TutorialSequenceId} from "@web/ui/tutorialSteps.ts";

type AppScreen = "main" | "game" | "pause" | "settings";

function App() {
  const [isGameBooting, setIsGameBooting] = useState<boolean>(true)
    const [bootError, setBootError] = useState<string | null>(null);
    const [size, setSize] = useState({width: window.innerWidth, height: window.innerHeight});
    const [screen, setScreen] = useState<AppScreen>("main");
    const [settingsReturn, setSettingsReturn] = useState<"main" | "pause">("main");
    const [tutorialsDisabled, setTutorialsDisabled] = useState(() => localStorage.getItem("factstories-tutorials-disabled") === "true");
    const [hasStarted, setHasStarted] = useState(false);
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);
    const [tutorialSequence, setTutorialSequence] = useState<TutorialSequenceId>("basics");
    const [shownTutorials, setShownTutorials] = useState<Set<TutorialSequenceId>>(() => new Set());
    const [hasSave, setHasSave] = useState(hasSavedGame());
    const currentTool = useAppSelector(selectCurentTool)
    const campaignLevels = useWorldSelector(world => world.campaign.levels);
    const previousLevelStatuses = useRef<Map<string, string> | null>(null);
    const dispatch = useAppDispatch();
    useEffect(() => {
        let cancelled = false;
        loadGameAssets().then(() => {
          if (cancelled) return;
          setIsGameBooting(false);
        }).catch(() => {
          if (!cancelled) setBootError("Impossible de charger les images du jeu. Recharge la page pour réessayer.");
        });
        const resize = () => setSize({width: window.innerWidth, height: window.innerHeight});
        window.addEventListener("resize", resize);
        return () => {
          cancelled = true;
          pauseGame();
          window.removeEventListener("resize", resize);
        };
    }, []);

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || tutorialStep !== null) return;
        if (screen === "settings") {
          setScreen(settingsReturn);
          return;
        }
        if (!hasStarted) return;
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
    }, [dispatch, hasStarted, screen, settingsReturn, tutorialStep]);

    useEffect(() => {
      if (tutorialsDisabled || !hasStarted || screen !== "game" || tutorialStep !== null) return;
      const unlocked = (id: string) => campaignLevels.some(level => level.id === id && level.status !== "locked");
      const next = (["level-2", "level-3", "level-4", "level-5", "level-6"] as TutorialSequenceId[])
        .find(sequence => unlocked(sequence) && !shownTutorials.has(sequence));
      if (!next) return;
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        pauseGame();
        dispatch(setPaused(true));
        setShownTutorials(previous => new Set(previous).add(next));
        setTutorialSequence(next);
        setTutorialStep(0);
      });
      return () => { cancelled = true; };
    }, [campaignLevels, dispatch, hasStarted, screen, shownTutorials, tutorialStep, tutorialsDisabled]);

    useEffect(() => {
      const current = new Map(campaignLevels.map(level => [level.id, level.status]));
      const previous = previousLevelStatuses.current;
      previousLevelStatuses.current = current;
      if (!hasStarted || !previous) return;
      const newlyCompleted = campaignLevels.some(level => level.status === "completed" && previous.get(level.id) !== "completed");
      if (!newlyCompleted) return;
      pauseGame();
      dispatch(setPaused(true));
    }, [campaignLevels, dispatch, hasStarted]);

    const play = () => {
      setHasStarted(true);
      setScreen("game");
      dispatch(setPaused(false));
      startGame();
    };
    const openTutorial = () => {
      if (tutorialsDisabled) return;
      setHasStarted(true);
      setScreen("game");
      pauseGame();
      dispatch(setPaused(true));
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
      setHasStarted(true);
      setScreen("game");
      setShownTutorials(new Set(["basics"]));
      if (tutorialsDisabled) {
        setTutorialStep(null);
        dispatch(setPaused(false));
        startGame();
        return;
      }
      pauseGame();
      dispatch(setPaused(true));
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

    const openSettings = (origin: "main" | "pause") => {
      setSettingsReturn(origin);
      setScreen("settings");
    };
    const changeTutorialsDisabled = (disabled: boolean) => {
      localStorage.setItem("factstories-tutorials-disabled", String(disabled));
      setTutorialsDisabled(disabled);
      if (disabled) setTutorialStep(null);
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
      onPlay={play} onNewCampaign={newCampaign} onTutorial={openTutorial}
      tutorialsDisabled={tutorialsDisabled} onSettings={() => openSettings("main")} />}
    {screen === "pause" && <GameMenu mode="pause" onPlay={play} onTutorial={openTutorial}
      tutorialsDisabled={tutorialsDisabled} onSettings={() => openSettings("pause")} onMainMenu={openMainMenu} />}
    {screen === "settings" && <GameSettings tutorialsDisabled={tutorialsDisabled}
      onTutorialsDisabledChange={changeTutorialsDisabled} onBack={() => setScreen(settingsReturn)} />}
    {!tutorialsDisabled && tutorialStep !== null && <Tutorial step={tutorialStep} steps={tutorialSequences[tutorialSequence]} onStepChange={setTutorialStep}
      onClose={() => setTutorialStep(null)} />}
  </div>
}

export default App
