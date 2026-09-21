import {useEffect} from "react";
import {useAppSelector} from "@web/store/hooks.ts";
import {selectCurentTool, selectSelectedItem} from "@web/store/selectors.ts";
import {tutorialSteps} from "./tutorialSteps.ts";

type TutorialProps = {
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
};

export function Tutorial({step, onStepChange, onClose}: TutorialProps) {
  const selectedItem = useAppSelector(selectSelectedItem);
  const currentTool = useAppSelector(selectCurentTool);
  const current = tutorialSteps[step];
  const isLast = step === tutorialSteps.length - 1;
  const interactionComplete = (!current.expectedSelection || selectedItem === current.expectedSelection) &&
    (!current.expectedTool || currentTool === current.expectedTool);

  useEffect(() => {
    const target = current.target
      ? document.querySelector<HTMLElement>(`[data-tutorial="${current.target}"]`)
      : null;
    target?.classList.add("tutorial-target");
    return () => target?.classList.remove("tutorial-target");
  }, [current.target]);

  return <aside className="tutorial-card" aria-live="polite" aria-label="Tutoriel">
    <div className="tutorial-progress" aria-label={`Étape ${step + 1} sur ${tutorialSteps.length}`}>
      <span style={{width: `${((step + 1) / tutorialSteps.length) * 100}%`}} />
    </div>
    <div className="tutorial-heading">
      <div>
        <span className="tutorial-eyebrow">{current.eyebrow}</span>
        <h2>{current.title}</h2>
      </div>
      <span className="tutorial-count">{step + 1}/{tutorialSteps.length}</span>
    </div>
    <p>{current.description}</p>
    {current.tip && <p className="tutorial-tip">💡 {current.tip}</p>}
    {!interactionComplete && <p className="tutorial-action">Sélectionne l’élément mis en évidence pour continuer.</p>}
    <div className="tutorial-actions">
      <button className="text-button" onClick={onClose}>Quitter</button>
      <div>
        {step > 0 && <button className="secondary-button" onClick={() => onStepChange(step - 1)}>Retour</button>}
        <button className="primary-button" disabled={!interactionComplete}
          onClick={() => isLast ? onClose() : onStepChange(step + 1)}>
          {isLast ? "Commencer à jouer" : "Continuer"}
        </button>
      </div>
    </div>
  </aside>;
}
