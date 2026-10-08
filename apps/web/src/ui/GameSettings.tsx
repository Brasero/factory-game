type GameSettingsProps = {
  tutorialsDisabled: boolean;
  onTutorialsDisabledChange: (disabled: boolean) => void;
  onBack: () => void;
};

export function GameSettings({tutorialsDisabled, onTutorialsDisabledChange, onBack}: GameSettingsProps) {
  return <div className="menu-screen settings-menu" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div className="menu-panel settings-panel">
      <header className="settings-header">
        <span className="menu-kicker">PRÉFÉRENCES DE JEU</span>
        <h1 id="settings-title">Paramètres</h1>
        <p>Personnalise ton expérience de jeu. Tes choix sont conservés pour tes prochaines parties.</p>
      </header>
      <div className="settings-sections">
        <section className="settings-section" aria-labelledby="guidance-settings-title">
          <h2 id="guidance-settings-title">Accompagnement</h2>
          <div className="settings-row">
            <div>
              <label className="settings-option" htmlFor="disable-tutorials">Désactiver les tutoriels</label>
              <p id="tutorials-setting-description">Aucun tutoriel ne s’affiche, y compris au début d’une nouvelle campagne et lors du déblocage de machines ou de recettes. Décoche cette option pour les réactiver.</p>
            </div>
            <input id="disable-tutorials" type="checkbox" checked={tutorialsDisabled} aria-describedby="tutorials-setting-description"
              onChange={event => onTutorialsDisabledChange(event.target.checked)} />
          </div>
        </section>
      </div>
      <footer className="settings-footer">
        <small>Échap pour revenir au menu</small>
        <button className="secondary-button" onClick={onBack}>Retour</button>
      </footer>
    </div>
  </div>;
}
