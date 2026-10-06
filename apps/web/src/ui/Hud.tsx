import "./hud.scss";
import {useAppDispatch, useAppSelector} from "@web/store/hooks.ts";
import {useWorldSelector} from "@web/game/worldStore.ts";
import {selectCurentTool, selectGamePaused, selectSelectedItem, selectSelectedVariant} from "@web/store/selectors.ts";
import type {SelectedItem} from "@engine/api/types.ts";
import {setSelectedItem, setSelectedVariant, setToolMode, togglePause} from "@web/store/controlSlice.ts";
import {formatTicks} from "@web/utils/utils.ts";
import {pauseGame, startGame} from "@web/game/GameController.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import type {MachineVariant} from "@engine/models/Machine";
import {MACHINE_VARIANTS} from "@engine/config/machineConfig";
import {constructionCost} from "@engine/config/constructionConfig";
import {useEffect, useState} from "react";

const machineSelections: SelectedItem[] = ["miner", "water-pump", "iron-smelter", "assembler", "boiler", "recycler"];
const variantLabels: Record<MachineVariant, string> = {eco: "Écologique", standard: "Standard", industrial: "Industrielle"};
const multiplier = (value: number) => `×${value.toLocaleString("fr-FR")}`;

export function Hud() {
  const tick = useWorldSelector((world) => world.tick);
  const selectedItem = useAppSelector(selectSelectedItem);
  const paused = useAppSelector(selectGamePaused);
  const dispatch = useAppDispatch();
  const currentTool = useAppSelector(selectCurentTool);
  const selectedVariant = useAppSelector(selectSelectedVariant);
  const campaignLevels = useWorldSelector(world => world.campaign.levels);
  const unlockedDefinitions = CAMPAIGN_LEVELS.filter(level => campaignLevels.find(progress => progress.id === level.id)?.status !== "locked");
  const unlockedMachines = new Set(unlockedDefinitions.flatMap(level => level.unlocks.machines));
  const unlockedVariants = new Set(unlockedDefinitions.flatMap(level => level.unlocks.variants));
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const machineSelected = !!selectedItem && machineSelections.includes(selectedItem);

  const machineVariantSelector = (floating = false) => <div
    className={`machine-variant-panel${floating ? " floating" : ""}`}
    data-tutorial="machine-variants" aria-label="Performances des variantes de machine">
    <div className="machine-variant-heading">
      <strong>Variante de machine</strong>
      <span>Compare ses performances avant de la poser</span>
    </div>
    <div className="machine-variant-options">
      {(["eco", "standard", "industrial"] as MachineVariant[]).filter(variant => unlockedVariants.has(variant)).map(variant => {
        const profile = MACHINE_VARIANTS[variant];
        return <button key={variant} className={selectedVariant === variant ? "selected" : ""}
          aria-pressed={selectedVariant === variant} onClick={() => dispatch(setSelectedVariant(variant))}>
          <strong>{variantLabels[variant]}</strong>
          <span><small>Cadence</small><b>{multiplier(profile.speed)}</b></span>
          <span><small>Rendement</small><b>{multiplier(profile.production)}</b></span>
          <span><small>Pollution</small><b>{multiplier(profile.pollution)}</b></span>
          <span><small>Coût</small><b>🧱 {constructionCost(selectedItem || "miner", variant)}</b></span>
        </button>;
      })}
    </div>
  </div>;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.key.toLowerCase() !== "a" || event.ctrlKey || event.metaKey || event.altKey || event.repeat ||
          (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select")))) return;
      event.preventDefault();
      setBuildMenuOpen(open => !open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  
  const handleClick = (item: SelectedItem) => {
    if (currentTool !== "build") dispatch(setToolMode("build"));
    if (selectedItem === item) {
      dispatch(setSelectedItem(""));
      setBuildMenuOpen(false);
      return;
    }
    dispatch(setSelectedItem(item));
    setBuildMenuOpen(false);
  };
  const toggleGamePause = () => {
    const isPaused = !!paused;
    dispatch(togglePause());
    if (isPaused) {
      startGame();
      return;
    }
    pauseGame();
  };

  const toggleDestroyMode = () => {
    const newTool = currentTool === "build" ? "destroy" : "build";
    dispatch(setToolMode(newTool))
    dispatch(setSelectedItem(""));

  }
  
  const buttonMachineStyle = (item: SelectedItem) => {
    let style = "hud-tool-button";
    if (item === selectedItem) style += " selected";
    return style + " " + item;
  };

  const destroyButtonClass = () => {
    return "destroyBtn " + (currentTool === "destroy" ? "selected" : "")
  }
  const selectedConstruction = () => {
    if (!selectedItem || currentTool !== "build") return null;
    const labels: Partial<Record<SelectedItem, string>> = {
      miner: "Mineur", "water-pump": "Pompe à eau", "iron-smelter": "Fonderie",
      assembler: "Machine de production", boiler: "Boiler", conveyor: "Tapis roulant",
      recycler: "Recycleur",
      pipe: "Tuyau", merger: "Merger", splitter: "Splitter", "smart-splitter": "Splitter intelligent", storage: "Coffre"
    };
    let icon;
    if (selectedItem === "conveyor") icon = <span className="hud-atlas-icon conveyor-icon"
      style={{backgroundImage: `url(${assetManager.getImage("conveyor.tier1").src})`}} />;
    else if (selectedItem === "pipe") icon = <span className="hud-atlas-icon pipe-icon"
      style={{backgroundImage: `url(${assetManager.getImage("pipe.metal").src})`}} />;
    else if (selectedItem === "merger" || selectedItem === "splitter" || selectedItem === "smart-splitter") {
      const assetType = selectedItem === "smart-splitter" ? "splitter" : selectedItem;
      icon = <span className={`hud-atlas-icon router-icon ${selectedItem}`}
        style={{backgroundImage: `url(${assetManager.getImage(`router.${assetType}`).src})`}} />;
    }
    else if (selectedItem === "storage") icon = <img className="hud-tool-icon storage-icon"
      src={assetManager.getImage("storage.crate").src} alt=""/>;
    else if (selectedItem === "miner") icon = <img className="hud-tool-icon"
      src={assetManager.getImage("machine.miner.miner2.idle").src} alt=""/>;
    else if (selectedItem === "water-pump") icon = <img className="hud-tool-icon"
      src={assetManager.getImage("machine.pump.water.idle").src} alt=""/>;
    else if (selectedItem === "iron-smelter") icon = <img className="hud-tool-icon"
      src={assetManager.getImage("machine.automation.ironSmelter.idle").src} alt=""/>;
    else if (selectedItem === "assembler") icon = <img className="hud-tool-icon"
      src={assetManager.getImage(`machine.automation.assembler.${selectedVariant}.idle`).src} alt=""/>;
    else if (selectedItem === "boiler") icon = <img className="hud-tool-icon"
      src={assetManager.getImage("machine.automation.boiler.idle").src} alt=""/>;
    else if (selectedItem === "recycler") icon = <img className="hud-tool-icon"
      src={assetManager.getImage("machine.automation.recycler.idle").src} alt=""/>;
    else icon = <span className="selected-construction-fallback">{selectedItem}</span>;
    return <div className="selected-construction" aria-label={`Construction sélectionnée : ${labels[selectedItem] ?? selectedItem}`}
      title={labels[selectedItem] ?? selectedItem}>
      {icon}<span className="selected-construction-label"><b>{labels[selectedItem] ?? selectedItem}</b>
        <small>{machineSelected ? `Variante ${variantLabels[selectedVariant]} · ` : ""}🧱 {constructionCost(selectedItem, selectedVariant)}</small>
      </span>
    </div>;
  };
  return (<div id="hud_container">
      <div id="hud_info">
        <div id="hud_tick_container">
          <button id="hud_pause_btn" data-tutorial="pause" aria-label={paused ? "Reprendre la simulation" : "Mettre la simulation en pause"} onClick={toggleGamePause}>
            {paused ? "▶" : "⏸"}
          </button>
          <span id="hud_tick" className={paused ? "paused" : ""}>
            ⏱ {formatTicks(tick, "short")}
          </span>
        </div>
      </div>
    
    <button className="build-menu-toggle" data-tutorial="build-menu" aria-label="Ouvrir le menu de construction" aria-expanded={buildMenuOpen}
      onClick={() => setBuildMenuOpen(open => !open)}>🛠 <kbd>A</kbd></button>
    {!buildMenuOpen && selectedItem && <div className="selected-build-choice">
      {machineSelected && machineVariantSelector(true)}
      {selectedConstruction()}
    </div>}
    <div id="hud_commands" className={buildMenuOpen ? "open" : ""} aria-hidden={!buildMenuOpen}>
      <div id="hud_commands_extractor">
        <button data-tutorial="miner" aria-label="Mineur" title="Mineur — fer ou charbon" className={buttonMachineStyle("miner")} onClick={() => handleClick("miner")}>
          <img className="hud-tool-icon" src={assetManager.getImage("machine.miner.miner2.idle").src} alt=""/>
        </button>
        {unlockedMachines.has("water-pump") && <button data-tutorial="water-pump" aria-label="Pompe à eau" className={buttonMachineStyle("water-pump")} onClick={() => handleClick("water-pump")}>
          <img className="hud-tool-icon" src={assetManager.getImage("machine.pump.water.idle").src} alt=""/>
        </button>}
        <button data-tutorial="iron-smelter" aria-label="Fonderie" title="Fonderie — sélectionne sa recette après placement" className={buttonMachineStyle("iron-smelter")} onClick={() => handleClick("iron-smelter")}>
          <img className="hud-tool-icon" src={assetManager.getImage("machine.automation.ironSmelter.idle").src} alt="" />
        </button>
        {unlockedMachines.has("assembler") && <button data-tutorial="assembler" aria-label="Machine de production"
          title="Machine de production — sélectionne Fil de cuivre ou Circuit après placement"
          className={buttonMachineStyle("assembler")} onClick={() => handleClick("assembler")}>
          <img className="hud-tool-icon"
            src={assetManager.getImage(`machine.automation.assembler.${selectedVariant}.idle`).src} alt="" />
          </button>}
        {unlockedMachines.has("boiler") && <button data-tutorial="boiler" aria-label="Boiler dépolluant"
          title="Boiler — consomme de l’eau pour réduire la pollution"
          className={buttonMachineStyle("boiler")} onClick={() => handleClick("boiler")}>
          <img className="hud-tool-icon"
            src={assetManager.getImage("machine.automation.boiler.idle").src} alt="" />
        </button>}
        {unlockedMachines.has("recycler") && <button data-tutorial="recycler" aria-label="Recycleur"
          title="Recycleur — transforme toute ressource en matériaux de construction"
          className={buttonMachineStyle("recycler")} onClick={() => handleClick("recycler")}>
          <img className="hud-tool-icon" src={assetManager.getImage("machine.automation.recycler.idle").src} alt="" />
        </button>}
      </div>
      <div id="hud_commands_logistique">
        {(["merger", "splitter"] as const).map(type => <button key={type} data-tutorial={type}
          aria-label={type === "merger" ? "Merger" : "Splitter"}
          title={type === "merger" ? "Merger — 3 entrées, 1 sortie" : "Splitter — 1 entrée, 3 sorties"}
          className={buttonMachineStyle(type)} onClick={() => handleClick(type)}>
          <span className={`hud-atlas-icon router-icon ${type}`} style={{backgroundImage: `url(${assetManager.getImage(`router.${type}`).src})`}} />
        </button>)}
        <button data-tutorial="smart-splitter" aria-label="Splitter intelligent"
          title="Splitter intelligent — filtre les ressources par sortie"
          className={buttonMachineStyle("smart-splitter")} onClick={() => handleClick("smart-splitter")}>
          <span className="hud-atlas-icon router-icon smart-splitter"
            style={{backgroundImage: `url(${assetManager.getImage("router.splitter").src})`}} />
        </button>
        <button data-tutorial="conveyor" aria-label="Tapis roulant" className={buttonMachineStyle("conveyor")} onClick={() => handleClick("conveyor")}>
          <span className="hud-atlas-icon conveyor-icon"
            style={{backgroundImage: `url(${assetManager.getImage("conveyor.tier1").src})`}} />
        </button>
        {unlockedMachines.has("water-pump") && <button data-tutorial="pipe" aria-label="Tuyau d’eau" title="Tuyau — transporte exclusivement l’eau" className={buttonMachineStyle("pipe")} onClick={() => handleClick("pipe")}>
          <span className="hud-atlas-icon pipe-icon" style={{backgroundImage: `url(${assetManager.getImage("pipe.metal").src})`}} />
        </button>}
        <button data-tutorial="storage" aria-label="Coffre" className={buttonMachineStyle("storage")} onClick={() => handleClick("storage")}>
          <img className="hud-tool-icon storage-icon" src={assetManager.getImage("storage.crate").src} alt=""/>
        </button>
      </div>
      {machineSelected && machineVariantSelector()}
    </div>
    <button data-tutorial="destroy" aria-label="Mode destruction" title="Démolir une construction"
      className={destroyButtonClass()} onClick={toggleDestroyMode}>
      <svg className="destruction-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h10l-.7 13H7.7L7 7Zm2-3h6l1 2H8l1-2Zm1 6v7m4-7v7" />
      </svg>
    </button>
  </div>);
}
