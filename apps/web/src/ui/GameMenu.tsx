import {useEffect, useRef, useState} from "react";
import type {WorldSnapshot} from "@engine/api/types";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {config} from "@web/config/gridConfig";
import {render} from "@web/render/CanvasRenderer";

type GameMenuProps = {
  mode: "main" | "pause";
  onPlay: () => void;
  onTutorial: () => void;
  onSettings?: () => void;
  tutorialsDisabled?: boolean;
  onMainMenu?: () => void;
  onNewCampaign?: () => void;
  hasSave?: boolean;
  savePreview?: WorldSnapshot;
  backgroundWorld?: WorldSnapshot;
};

function MenuWorldBackdrop({world}: {world: WorldSnapshot}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(() => ({width: window.innerWidth, height: window.innerHeight}));
  const definition = CAMPAIGN_LEVELS.find(level => level.id === world.campaign.activeLevelId) ?? CAMPAIGN_LEVELS[0];

  useEffect(() => {
    const resize = () => setSize({width: window.innerWidth, height: window.innerHeight});
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(0.8, Math.min(1.35, Math.min(size.width, size.height) / 720));
    render(ctx, world, {
      scale,
      minScale: scale,
      maxScale: scale,
      x: size.width / 2 - definition.center.x * config.CELL_SIZE * scale,
      y: size.height / 2 - definition.center.y * config.CELL_SIZE * scale
    });
  }, [definition, size, world]);

  return <canvas className="menu-world-backdrop" ref={canvasRef} width={size.width} height={size.height} aria-hidden="true" />;
}

function SavePreview({world}: {world: WorldSnapshot}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const definition = CAMPAIGN_LEVELS.find(level => level.id === world.campaign.activeLevelId) ?? CAMPAIGN_LEVELS[0];
  const progress = world.campaign.levels.find(level => level.id === definition.id);
  const pollution = Math.round(world.campaign.pollution / world.campaign.pollutionLimit * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const diameter = definition.radius * 2 * config.CELL_SIZE;
    const scale = Math.min(canvas.width / diameter, canvas.height / diameter) * 0.9;
    render(ctx, world, {
      scale,
      minScale: scale,
      maxScale: scale,
      x: canvas.width / 2 - definition.center.x * config.CELL_SIZE * scale,
      y: canvas.height / 2 - definition.center.y * config.CELL_SIZE * scale
    });
  }, [definition, world]);

  return <aside className="save-preview" aria-label="Aperçu de la sauvegarde">
    <div className="save-preview-screen"><canvas ref={canvasRef} width={360} height={204} /></div>
    <div className="save-preview-heading">
      <span>PARTIE EN COURS</span>
      <strong>{definition.name}</strong>
    </div>
    <div className="save-preview-stats">
      <div><small>Niveau</small><strong>{CAMPAIGN_LEVELS.indexOf(definition) + 1} / {CAMPAIGN_LEVELS.length}</strong></div>
      <div><small>Temps</small><strong>{world.tick} ticks</strong></div>
      <div><small>Pollution</small><strong>{pollution}%</strong></div>
      <div><small>État</small><strong>{progress?.status ?? "active"}</strong></div>
    </div>
  </aside>;
}

export function GameMenu({mode, onPlay, onTutorial, onMainMenu, onNewCampaign, hasSave, savePreview, backgroundWorld, onSettings, tutorialsDisabled}: GameMenuProps) {
  const isMain = mode === "main";
  const [showPreview, setShowPreview] = useState(false);
  return <div className={`menu-screen ${isMain ? "main-menu" : "pause-menu"}`} role="dialog" aria-modal="true"
    aria-labelledby="menu-title">
    {isMain && backgroundWorld && <MenuWorldBackdrop world={backgroundWorld} />}
    <div className="menu-panel">
      {isMain && <div className="menu-factory-mark" aria-hidden="true"><i/><i/><i/><span>FACTORY ONLINE</span></div>}
      <span className="menu-kicker">AUTOMATISATION · EXPLORATION · PRODUCTION</span>
      <h1 id="menu-title">{isMain ? "Factstories" : "Jeu en pause"}</h1>
      <p>{isMain
        ? "Transforme une île sauvage en une usine parfaitement organisée."
        : "Ta production est arrêtée. Tu peux reprendre exactement où tu en étais."}</p>
      <div className="menu-actions">
        <div className="continue-action" onMouseEnter={() => setShowPreview(true)} onMouseLeave={() => setShowPreview(false)}>
          <button className="primary-button menu-primary" onClick={onPlay}
            onFocus={() => setShowPreview(true)} onBlur={() => setShowPreview(false)}>
            {isMain ? hasSave ? "Continuer" : "Jouer" : "Reprendre"}
          </button>
          {isMain && hasSave && savePreview && showPreview && <SavePreview world={savePreview} />}
        </div>
        {isMain && hasSave && <button className="secondary-button" onClick={onNewCampaign}>Nouvelle campagne</button>}
        <button className="secondary-button" onClick={onTutorial} disabled={tutorialsDisabled}
          title={tutorialsDisabled ? "Réactive les tutoriels dans les paramètres pour les consulter." : undefined}>Tutoriel</button>
        {onSettings && <button className="secondary-button" onClick={onSettings}>Paramètres</button>}
        {!isMain && <button className="text-button" onClick={onMainMenu}>Retour au menu principal</button>}
      </div>
      {isMain && <div className="goal-preview">
        <span>OBJECTIFS</span>
        <strong>Six îles à industrialiser</strong>
        <p>Produis vite, maîtrise la pollution et relie tes usines par les tunnels.</p>
      </div>}
      <small>{isMain ? "Version de développement" : "Échap pour reprendre"}</small>
    </div>
  </div>;
}
