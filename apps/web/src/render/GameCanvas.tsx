import {useEffect, useEffectEvent, useRef, useState} from "react";
import {useAppSelector, useAppDispatch} from "@web/store/hooks";
import {render} from "./CanvasRenderer";
import {drawPreviewConveyor} from "./utils/conveyor";
import {drawPreviewPipes} from "./utils/pipe";
import {getWorldSnapshot, subscribeWorld, useWorldSnapshot} from "@web/game/worldStore";
import {destroyEntity, placeMiner, placeMachine, placeConveyor, placeCoalMine, placeConveyorLine, placeIronMine,
  placeStorage, canPlaceAt, placePipeLine, destroyEntities} from "@web/game/GameController";
import {selectCurentTool, selectGamePaused, selectSelectedItem, selectSelectedVariant} from "@web/store/selectors";
import {setSelectedItem, setToolMode} from "@web/store/controlSlice";
import type {Position, ConveyorPlacement, DirectionType, Conveyor} from "@engine/api/types";
import {buildConveyorPlacements, getBestPath, getRectangleCells} from "./utils/canvas";
import type {Camera} from "@web/model/Camera";
import {CAMPAIGN_LEVELS, campaignLevelAt} from "@engine/config/campaignConfig";
import {MachineRecipePanel} from "@web/ui/MachineRecipePanel";
import {createDestructionParticles, drawDestructionParticles, drawDestructionPreview, type DestructionParticle} from "./utils/destructionParticles";
import {SmartSplitterPanel} from "@web/ui/SmartSplitterPanel";
import {machineFootprintCells, machineOccupies} from "@engine/config/machineFootprint";
import type {MachineType} from "@engine/models/Machine";

import {buildConveyorMotion, type ConveyorMotion} from "./utils/conveyorMotion";

interface GameCanvasProps {width: number; height: number; cellSize: number}
type Drag = {start: Position; last: Position; mode: "pan" | "network" | "destroy"; moved: boolean; lastCell?: Position;
  button: 0 | 1 | 2; startCell?: Position};

export function GameCanvas({width, height, cellSize}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Drag | null>(null);
  const horizontalFirst = useRef(true);
  const suppressClick = useRef(false);
  const suppressContextMenu = useRef(false);
  const camera = useRef<Camera>({scale: 1, minScale: 0.5, maxScale: 2.5, x: 0, y: 0});
  const world = useWorldSnapshot();
  const lastActiveLevel = useRef<string>("");
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);
  const currentTool = useAppSelector(selectCurentTool);
  const selectedVariant = useAppSelector(selectSelectedVariant);
  const paused = useAppSelector(selectGamePaused);
  const snapshotTime = useRef(performance.now());
  const renderSnapshot = useRef(world);
  const conveyorMotion = useRef<ConveyorMotion>(new Map());
  const destructionParticles = useRef<DestructionParticle[]>([]);
  const isDirectionalTool = selectedItem === "conveyor" || selectedItem === "pipe" || selectedItem === "splitter" || selectedItem === "smart-splitter" || selectedItem === "merger";
  const [beltDirection, setBeltDirection] = useState<DirectionType>("right");
  const [hover, setHover] = useState<Position | null>(null);
  const [preview, setPreview] = useState<ConveyorPlacement[]>([]);
  const [, redrawCamera] = useState(0);
  const [inspectedMachine, setInspectedMachine] = useState<{id: string; left: number; top: number} | null>(null);
  const [inspectedSplitter, setInspectedSplitter] = useState<{id: string; left: number; top: number} | null>(null);
  const machine = inspectedMachine ? world.machines.find(item => item.id === inspectedMachine.id) : undefined;
  const smartSplitter = inspectedSplitter ? world.conveyors.find(item => item.id === inspectedSplitter.id && item.type === "smart-splitter") : undefined;

  useEffect(() => {
    const unsubscribe = subscribeWorld(() => {
      const next = getWorldSnapshot();
      if (next.tick !== renderSnapshot.current.tick) snapshotTime.current = performance.now();
      conveyorMotion.current = buildConveyorMotion(renderSnapshot.current, next, conveyorMotion.current);
      renderSnapshot.current = next;
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!world.grid) return;
    if (lastActiveLevel.current === world.campaign.activeLevelId) return;
    const level = CAMPAIGN_LEVELS.find(item => item.id === world.campaign.activeLevelId);
    if (!level) return;
    camera.current.x = width / 2 - level.center.x * cellSize;
    camera.current.y = height / 2 - level.center.y * cellSize;
    lastActiveLevel.current = level.id;
    redrawCamera(version => version + 1);
  }, [cellSize, height, width, world.campaign.activeLevelId, world.grid]);

  const cellAt = (clientX: number, clientY: number): Position => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.floor((clientX - rect.left - camera.current.x) / camera.current.scale / cellSize),
      y: Math.floor((clientY - rect.top - camera.current.y) / camera.current.scale / cellSize)
    };
  };
  const pathTo = (end: Position) => buildConveyorPlacements(getBestPath(
    cellAt(drag.current!.start.x, drag.current!.start.y), end,
    pos => canPlaceAt(pos.x, pos.y, selectedItem === "pipe" ? "pipe" : "conveyor"),
    horizontalFirst.current
  ), beltDirection);
  const addDestructionParticles = (cell: Position) => {
    const decoration = world.grid?.tiles[cell.y]?.[cell.x]?.decoration;
    const palette = decoration?.type === "tree" ? ["#315b35", "#598447", "#7a5835"]
      : decoration?.type === "rock" ? ["#667080", "#89909b", "#414957"]
      : ["#c47a3d", "#e0a45d", "#596274"];
    destructionParticles.current.push(...createDestructionParticles(cell, cellSize, performance.now(), palette));
  };
  const destroyAt = (cell: Position) => {
    if (destroyEntity(cell.x, cell.y)) addDestructionParticles(cell);
  };
  const drawFrame = useEffectEvent((now: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const snapshot = renderSnapshot.current;
    const storage = hover ? world.storages.find(s => s.x === hover.x && s.y === hover.y) : undefined;
    const highlight = hover && (selectedItem || currentTool === "destroy")
      ? {...hover, canPlace: canPlaceAt(hover.x, hover.y, selectedItem, selectedVariant),
        footprint: selectedItem === "boiler" || selectedItem === "advanced-assembler"
          ? machineFootprintCells({...hover, type: selectedItem as MachineType}) : undefined} : undefined;
    const tickInterpolation = paused ? 1 : Math.min(1, Math.max(0, (now - snapshotTime.current) / 100));
    render(ctx, snapshot, camera.current, highlight, storage, undefined, tickInterpolation, now, conveyorMotion.current);
    const destruction = drag.current;
    if (destruction?.mode === "destroy" && destruction.startCell && destruction.lastCell) {
      drawDestructionPreview(ctx, destruction.startCell, destruction.lastCell, cellSize);
    }
    destructionParticles.current = destructionParticles.current.filter(particle => now - particle.bornAt < particle.lifetime);
    if (destructionParticles.current.length) drawDestructionParticles(ctx, destructionParticles.current, now);
    if (isDirectionalTool && selectedItem !== "pipe" && currentTool === "build") {
      const placement = preview.length ? preview : hover && canPlaceAt(hover.x, hover.y, selectedItem, selectedVariant)
        ? [{...hover, direction: beltDirection, type: selectedItem as Conveyor["type"]}] : [];
      if (placement.length) drawPreviewConveyor(ctx, placement, world);
    }
    if (selectedItem === "pipe" && currentTool === "build") {
      const placement = preview.length ? preview : hover && canPlaceAt(hover.x, hover.y, "pipe", selectedVariant)
        ? [{...hover, direction: beltDirection}] : [];
      if (placement.length) drawPreviewPipes(ctx, placement, world, cellSize);
    }
  });
  useEffect(() => {
    let frame = 0;
    const animate = (now: number) => {
      drawFrame(now);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Stable subscriptions; effect events read the latest tool and camera state.
  const finishDrag = useEffectEvent((event: MouseEvent) => {
    if (!drag.current || event.button !== drag.current.button) return;
    const active = drag.current;
    if (active.button === 0) suppressClick.current = active.moved || active.mode === "destroy";
    if (active.button === 2 && active.moved) suppressContextMenu.current = true;
    if (active.mode === "network" && (selectedItem === "conveyor" || selectedItem === "pipe") && event.target === canvasRef.current) {
      const line = pathTo(cellAt(event.clientX, event.clientY));
      if (selectedItem === "pipe") placePipeLine(line);
      else placeConveyorLine(line);
    }
    if (active.mode === "destroy") {
      const positions = active.startCell
        ? getRectangleCells(active.startCell, cellAt(event.clientX, event.clientY)) : [];
      const levelThree = world.campaign.levels.find(level => level.id === "level-3");
      const levelThreeUnlocked = !!levelThree && levelThree.status !== "locked";
      const entityPositions = new Set([
        ...world.machines.flatMap(machine => machineFootprintCells(machine)),
        ...world.conveyors, ...(world.pipes ?? []), ...world.storages
      ].map(entity => `${entity.x},${entity.y}`));
      const destroyedPositions = positions.filter(position => {
        const definition = campaignLevelAt(position.x, position.y) ??
          CAMPAIGN_LEVELS.find(level => level.id === world.campaign.activeLevelId);
        const progress = world.campaign.levels.find(level => level.id === definition?.id);
        if (!progress || progress.status === "locked" || progress.status === "finalized") return false;
        return entityPositions.has(`${position.x},${position.y}`) ||
          (levelThreeUnlocked && !!world.grid?.tiles[position.y]?.[position.x]?.decoration);
      });
      if (destroyEntities(positions)) {
        for (const position of destroyedPositions) addDestructionParticles(position);
      }
    }
    drag.current = null;
    setPreview([]);
  });
  const cancelDrag = useEffectEvent(() => {
    drag.current = null;
    setPreview([]);
  });
  const rotateBelt = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target;
    if (!isDirectionalTool || currentTool !== "build" || event.key.toLowerCase() !== "r" ||
        event.ctrlKey || event.metaKey || event.altKey || event.repeat ||
        (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select")))) return;
    event.preventDefault();
    if (drag.current?.mode === "network") {
      horizontalFirst.current = !horizontalFirst.current;
      if (drag.current.lastCell) setPreview(pathTo(drag.current.lastCell));
      return;
    }
    const directions: DirectionType[] = ["right", "down", "left", "up"];
    const next = directions[(directions.indexOf(beltDirection) + (event.shiftKey ? 3 : 1)) % 4];
    setBeltDirection(next);
    setPreview(previous => previous.length === 1 ? [{...previous[0], direction: next}] : previous);
  });
  const handleWheel = useEffectEvent((event: WheelEvent) => {
    event.preventDefault();
    if (currentTool === "destroy") return;
    const canvas = canvasRef.current!;
    const c = camera.current;
    const scale = Math.min(c.maxScale, Math.max(c.minScale, c.scale * (event.deltaY > 0 ? 1 / 1.1 : 1.1)));
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    c.x = x - (x - c.x) * scale / c.scale;
    c.y = y - (y - c.y) * scale / c.scale;
    c.scale = scale;
    redrawCamera(v => v + 1);
  });
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wheel = (event: WheelEvent) => handleWheel(event);
    const keydown = (event: KeyboardEvent) => rotateBelt(event);
    window.addEventListener("keydown", keydown);
    const up = (event: MouseEvent) => finishDrag(event);
    const blur = () => cancelDrag();
    canvas.addEventListener("wheel", wheel, {passive: false});
    window.addEventListener("mouseup", up);
    window.addEventListener("blur", blur);
    return () => {
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const hoveredBelt = hover && !selectedItem && currentTool === "build" ? world.conveyors.find(belt => belt.x === hover.x && belt.y === hover.y) : undefined;
  return <div style={{position: "relative", width, height}}>
    {isDirectionalTool && currentTool === "build" && <div className="conveyor-help" role="status">
      <strong>{selectedItem === "conveyor" ? "Tapis roulant" : selectedItem === "pipe" ? "Tuyau" : selectedItem === "merger" ? "Merger" : selectedItem === "smart-splitter" ? "Splitter intelligent" : "Splitter"} · {{right: "→", down: "↓", left: "←", up: "↑"}[beltDirection]}</strong>
      {selectedItem !== "conveyor" && selectedItem !== "pipe" && <span><span style={{color: "#65dfff"}}>Bleu : entrées</span> · <span style={{color: "#ffd166"}}>Jaune : sorties</span></span>}
      <span><kbd>R</kbd> horaire / virage · <kbd>Maj+R</kbd> antihoraire</span>
      <span>Glisser droit ou molette : déplacer la caméra</span>
    </div>}
    {machine && inspectedMachine && <MachineRecipePanel machine={machine} left={inspectedMachine.left}
      top={inspectedMachine.top} onClose={() => setInspectedMachine(null)} />}
    {smartSplitter && inspectedSplitter && <SmartSplitterPanel splitter={smartSplitter} left={inspectedSplitter.left}
      top={inspectedSplitter.top} onClose={() => setInspectedSplitter(null)} />}
    {hoveredBelt && <div className="belt-flow-tooltip" role="status">Débit du tapis : {(hoveredBelt.flow?.rate ?? 0).toFixed(2)} unités/s <small>Dernier intervalle de 10 secondes · Sorties réussies</small></div>}
    <canvas ref={canvasRef} width={width} height={height} aria-label="Carte de l’usine"
    onMouseDown={event => {
      if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
      if (event.button !== 0) {
        if (currentTool === "destroy") return;
        event.preventDefault();
        const pos = {x: event.clientX, y: event.clientY};
        drag.current = {start: pos, last: pos, moved: false, mode: "pan", button: event.button as 1 | 2};
        return;
      }
      suppressClick.current = false;
      if (currentTool === "destroy") {
        const cell = cellAt(event.clientX, event.clientY);
        drag.current = {start: {x: event.clientX, y: event.clientY}, last: {x: event.clientX, y: event.clientY},
          startCell: cell, lastCell: cell, moved: false, mode: "destroy", button: 0};
        setInspectedMachine(null);
      } else if (selectedItem === "conveyor" || selectedItem === "pipe" || (!selectedItem && currentTool === "build")) {
        const pos = {x: event.clientX, y: event.clientY};
        horizontalFirst.current = true;
        drag.current = {start: pos, last: pos, moved: false,
          mode: selectedItem === "conveyor" || selectedItem === "pipe" ? "network" : "pan", button: 0};
      }
    }}
    onMouseMove={event => {
      const active = drag.current;
      const activeButtonMask = active ? ({0: 1, 1: 4, 2: 2} as const)[active.button] : 0;
      if (active && (event.buttons & activeButtonMask) !== 0) {
        active.moved ||= Math.hypot(event.clientX - active.start.x, event.clientY - active.start.y) > 3;
        if (active.mode === "pan") {
          camera.current.x += event.clientX - active.last.x;
          camera.current.y += event.clientY - active.last.y;
          active.last = {x: event.clientX, y: event.clientY};
          redrawCamera(v => v + 1);
        } else if (active.mode === "network") {
          const nextCell = cellAt(event.clientX, event.clientY);
          active.lastCell = nextCell;
          setPreview(pathTo(nextCell));
        } else {
          const nextCell = cellAt(event.clientX, event.clientY);
          active.lastCell = nextCell;
        }
      }
      const next = cellAt(event.clientX, event.clientY);
      setHover(previous => previous?.x === next.x && previous.y === next.y ? previous : next);
    }}
    onMouseLeave={() => setHover(null)}
    onContextMenu={event => {
      event.preventDefault();
      if (suppressContextMenu.current) {
        suppressContextMenu.current = false;
        return;
      }
      drag.current = null;
      setPreview([]);
      dispatch(setSelectedItem(""));
      dispatch(setToolMode("build"));
      setInspectedMachine(null);
      setInspectedSplitter(null);
    }}
    onClick={event => {
      if (suppressClick.current) { suppressClick.current = false; return; }
      const {x, y} = cellAt(event.clientX, event.clientY);
      if (currentTool === "destroy") { destroyAt({x, y}); setInspectedMachine(null); return; }
      const clickedMachine = world.machines.find(item => machineOccupies(item, {x, y}));
      if (clickedMachine) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setInspectedMachine({id: clickedMachine.id,
          left: Math.max(12, Math.min(width - 332, event.clientX - rect.left + 12)),
          top: Math.max(12, Math.min(height - 380, event.clientY - rect.top + 12))});
        return;
      }
      setInspectedMachine(null);
      const clickedSplitter = world.conveyors.find(item => item.x === x && item.y === y && item.type === "smart-splitter");
      if (clickedSplitter) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setInspectedSplitter({id: clickedSplitter.id,
          left: Math.max(12, Math.min(width - 332, event.clientX - rect.left + 12)),
          top: Math.max(12, Math.min(height - 380, event.clientY - rect.top + 12))});
        return;
      }
      setInspectedSplitter(null);
      switch (selectedItem) {
        case "merger":
        case "splitter":
        case "smart-splitter": placeConveyor(x, y, beltDirection, selectedItem); break;
        case "miner": placeMiner(x, y, selectedVariant); break;
        case "iron-mine": placeIronMine(x, y); break;
        case "coal-mine": placeCoalMine(x, y); break;
        case "water-pump": placeMachine(x, y, "water-pump", selectedVariant); break;
        case "iron-smelter": placeMachine(x, y, "iron-smelter", selectedVariant); break;
        case "assembler": placeMachine(x, y, "assembler", selectedVariant); break;
        case "advanced-assembler": placeMachine(x, y, "advanced-assembler", selectedVariant); break;
        case "boiler": placeMachine(x, y, "boiler", selectedVariant); break;
        case "recycler": placeMachine(x, y, "recycler", selectedVariant); break;
        case "storage": placeStorage(x, y); break;
        case "shipping-depot": placeStorage(x, y, "shipping-depot"); break;
      }
    }} />
  </div>;
}
