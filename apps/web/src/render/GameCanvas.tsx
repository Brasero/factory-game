import {useEffect, useEffectEvent, useRef, useState} from "react";
import {useAppSelector, useAppDispatch} from "@web/store/hooks";
import {render} from "./CanvasRenderer";
import {drawPreviewConveyor} from "./utils/conveyor";
import {useWorldSnapshot} from "@web/game/worldStore";
import {destroyEntity, placeMiner, placeMachine, placeConveyor, placeCoalMine, placeConveyorLine, placeIronMine,
  placeStorage, canPlaceAt} from "@web/game/GameController";
import {selectCurentTool, selectSelectedItem, selectSelectedVariant} from "@web/store/selectors";
import {setSelectedItem, setToolMode} from "@web/store/controlSlice";
import type {Position, ConveyorPlacement, DirectionType} from "@engine/api/types";
import {buildConveyorPlacements, getBestPath} from "./utils/canvas";
import type {Camera} from "@web/model/Camera";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {MachineRecipePanel} from "@web/ui/MachineRecipePanel";

interface GameCanvasProps {width: number; height: number; cellSize: number}
type Drag = {start: Position; last: Position; mode: "pan" | "conveyor"; moved: boolean};

export function GameCanvas({width, height, cellSize}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const camera = useRef<Camera>({scale: 1, minScale: 0.5, maxScale: 2.5, x: 0, y: 0});
  const world = useWorldSnapshot();
  const lastActiveLevel = useRef<string>("");
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);
  const currentTool = useAppSelector(selectCurentTool);
  const selectedVariant = useAppSelector(selectSelectedVariant);
  const isDirectionalTool = selectedItem === "conveyor" || selectedItem === "splitter" || selectedItem === "merger";
  const [beltDirection, setBeltDirection] = useState<DirectionType>("right");
  const [hover, setHover] = useState<Position | null>(null);
  const [preview, setPreview] = useState<ConveyorPlacement[]>([]);
  const [cameraVersion, redrawCamera] = useState(0);
  const [inspectedMachine, setInspectedMachine] = useState<{id: string; left: number; top: number} | null>(null);
  const machine = inspectedMachine ? world.machines.find(item => item.id === inspectedMachine.id) : undefined;

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
    pos => canPlaceAt(pos.x, pos.y, "conveyor")
  ), beltDirection);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const frame = requestAnimationFrame(() => {
      const storage = hover ? world.storages.find(s => s.x === hover.x && s.y === hover.y) : undefined;
      const highlight = hover && (selectedItem || currentTool === "destroy")
        ? {...hover, canPlace: canPlaceAt(hover.x, hover.y, selectedItem, selectedVariant)} : undefined;
      render(ctx, world, camera.current, highlight, storage);
      if (isDirectionalTool && currentTool === "build") {
        const placement = preview.length ? preview : hover && canPlaceAt(hover.x, hover.y, selectedItem, selectedVariant)
          ? [{...hover, direction: beltDirection, type: selectedItem as "conveyor" | "splitter" | "merger"}] : [];
        if (placement.length) drawPreviewConveyor(ctx, placement, world);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [world, hover, preview, selectedItem, selectedVariant, currentTool, cameraVersion, width, height, beltDirection, isDirectionalTool]);

  // Stable subscriptions; effect events read the latest tool and camera state.
  const finishDrag = useEffectEvent((event: MouseEvent) => {
    if (event.button !== 0 || !drag.current) return;
    suppressClick.current = drag.current.moved;
    if (drag.current.mode === "conveyor" && selectedItem === "conveyor" && event.target === canvasRef.current) {
      placeConveyorLine(pathTo(cellAt(event.clientX, event.clientY)));
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
    const directions: DirectionType[] = ["right", "down", "left", "up"];
    const next = directions[(directions.indexOf(beltDirection) + (event.shiftKey ? 3 : 1)) % 4];
    setBeltDirection(next);
    setPreview(previous => previous.length === 1 ? [{...previous[0], direction: next}] : previous);
  });
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const c = camera.current;
      const scale = Math.min(c.maxScale, Math.max(c.minScale, c.scale * (event.deltaY > 0 ? 1 / 1.1 : 1.1)));
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      c.x = x - (x - c.x) * scale / c.scale;
      c.y = y - (y - c.y) * scale / c.scale;
      c.scale = scale;
      redrawCamera(v => v + 1);
    };
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

  return <div style={{position: "relative", width, height}}>
    {isDirectionalTool && currentTool === "build" && <div className="conveyor-help" role="status">
      <strong>{selectedItem === "conveyor" ? "Tapis roulant" : selectedItem === "merger" ? "Merger" : "Splitter"} · {{right: "→", down: "↓", left: "←", up: "↑"}[beltDirection]}</strong>
      {selectedItem !== "conveyor" && <span><span style={{color: "#65dfff"}}>Bleu : entrées</span> · <span style={{color: "#ffd166"}}>Jaune : sorties</span></span>}
      <span><kbd>R</kbd> Rotation horaire</span>
      <span><kbd>Maj</kbd> + <kbd>R</kbd> Rotation antihoraire</span>
    </div>}
    {machine && inspectedMachine && <MachineRecipePanel machine={machine} left={inspectedMachine.left}
      top={inspectedMachine.top} onClose={() => setInspectedMachine(null)} />}
    <canvas ref={canvasRef} width={width} height={height} aria-label="Carte de l’usine"
    style={{border: "1px solid black"}}
    onMouseDown={event => {
      if (event.button !== 0) return;
      suppressClick.current = false;
      if (selectedItem === "conveyor" || (!selectedItem && currentTool === "build")) {
        const pos = {x: event.clientX, y: event.clientY};
        drag.current = {start: pos, last: pos, moved: false, mode: selectedItem === "conveyor" ? "conveyor" : "pan"};
      }
    }}
    onMouseMove={event => {
      const active = drag.current;
      if (active && event.buttons === 1) {
        active.moved ||= Math.hypot(event.clientX - active.start.x, event.clientY - active.start.y) > 3;
        if (active.mode === "pan") {
          camera.current.x += event.clientX - active.last.x;
          camera.current.y += event.clientY - active.last.y;
          active.last = {x: event.clientX, y: event.clientY};
          redrawCamera(v => v + 1);
        } else {
          setPreview(pathTo(cellAt(event.clientX, event.clientY)));
        }
      }
      const next = cellAt(event.clientX, event.clientY);
      setHover(previous => previous?.x === next.x && previous.y === next.y ? previous : next);
    }}
    onMouseLeave={() => setHover(null)}
    onContextMenu={event => {
      event.preventDefault();
      drag.current = null;
      setPreview([]);
      dispatch(setSelectedItem(""));
      dispatch(setToolMode("build"));
      setInspectedMachine(null);
    }}
    onClick={event => {
      if (suppressClick.current) { suppressClick.current = false; return; }
      const {x, y} = cellAt(event.clientX, event.clientY);
      if (currentTool === "destroy") { destroyEntity(x, y); setInspectedMachine(null); return; }
      const clickedMachine = world.machines.find(item => item.x === x && item.y === y);
      if (clickedMachine) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setInspectedMachine({id: clickedMachine.id,
          left: Math.max(12, Math.min(width - 332, event.clientX - rect.left + 12)),
          top: Math.max(12, Math.min(height - 380, event.clientY - rect.top + 12))});
        return;
      }
      setInspectedMachine(null);
      switch (selectedItem) {
        case "merger":
        case "splitter": placeConveyor(x, y, beltDirection, selectedItem); break;
        case "miner": placeMiner(x, y, selectedVariant); break;
        case "iron-mine": placeIronMine(x, y); break;
        case "coal-mine": placeCoalMine(x, y); break;
        case "water-pump": placeMachine(x, y, "water-pump", selectedVariant); break;
        case "iron-smelter": placeMachine(x, y, "iron-smelter", selectedVariant); break;
        case "assembler": placeMachine(x, y, "assembler", selectedVariant); break;
        case "boiler": placeMachine(x, y, "boiler", selectedVariant); break;
        case "storage": placeStorage(x, y); break;
      }
    }} />
  </div>;
}
