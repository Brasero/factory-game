type GameMenuProps = {
  mode: "main" | "pause";
  onPlay: () => void;
  onTutorial: () => void;
  onMainMenu?: () => void;
  onNewCampaign?: () => void;
  hasSave?: boolean;
};

export function GameMenu({mode, onPlay, onTutorial, onMainMenu, onNewCampaign, hasSave}: GameMenuProps) {
  const isMain = mode === "main";
  return <div className={`menu-screen ${isMain ? "main-menu" : "pause-menu"}`} role="dialog" aria-modal="true"
    aria-labelledby="menu-title">
    <div className="menu-panel">
      <span className="menu-kicker">AUTOMATISATION · EXPLORATION · PRODUCTION</span>
      <h1 id="menu-title">{isMain ? "Factstories" : "Jeu en pause"}</h1>
      <p>{isMain
        ? "Transforme une île sauvage en une usine parfaitement organisée."
        : "Ta production est arrêtée. Tu peux reprendre exactement où tu en étais."}</p>
      <div className="menu-actions">
        <button className="primary-button menu-primary" onClick={onPlay}>{isMain ? hasSave ? "Continuer" : "Jouer" : "Reprendre"}</button>
        {isMain && hasSave && <button className="secondary-button" onClick={onNewCampaign}>Nouvelle campagne</button>}
        <button className="secondary-button" onClick={onTutorial}>Tutoriel</button>
        {!isMain && <button className="text-button" onClick={onMainMenu}>Retour au menu principal</button>}
      </div>
      {isMain && <div className="goal-preview">
        <span>OBJECTIFS</span>
        <strong>Trois îles à industrialiser</strong>
        <p>Produis vite, maîtrise la pollution et relie tes usines par les tunnels.</p>
      </div>}
      <small>{isMain ? "Version de développement" : "Échap pour reprendre"}</small>
    </div>
  </div>;
}
