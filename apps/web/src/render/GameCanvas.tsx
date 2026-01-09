import {useEffect, useRef, useState} from "react";
import {useAppSelector, useAppDispatch} from "@web/store/hooks.ts";
import {render} from "@web/render/CanvasRenderer.ts";
import {drawPreviewConveyor} from "@web/render/utils/conveyor.ts";
import type {World} from "@engine/models/World.ts";
import {
  destroyEntity,
  placeCoalMine,
  placeConveyorLine,
  placeIronMine,
  placeStorage,
  placeWaterPump
} from "@web/game/GameController.ts";
import {selectCurentTool, selectGameState, selectSelectedItem} from "@web/store/selectors.ts";
import {setSelectedItem, setToolMode} from "@web/store/controlSlice.ts";
import type {Position} from "@engine/models/Position.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {SelectedItem} from "@engine/models/Controls.ts";
import {buildConveyorLine, buildConveyorPlacements, getBestPath, getLineCells} from "@web/render/utils/canvas.ts";

interface GameCanvasProps {
  width: number;
  height: number;
  cellSize: number;
}

interface ConveyorPreview extends Position {
  direction: DirectionType;
}

export function GameCanvas({ width, height, cellSize }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world: World = useAppSelector(selectGameState);
  const dispatch = useAppDispatch();
  const selectedItem: SelectedItem = useAppSelector(selectSelectedItem);
  const currentTool = useAppSelector(selectCurentTool)
  const [hoveredCell, setHoveredCell] = useState<Position & {canPlace: boolean} | null>(null);
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const [conveyorPreview, setConveyorPreview] = useState<ConveyorPreview[] | null>(null);
  const [hoveredStorage, setHoveredStorage] = useState<Storage | null>(null)
  
 
  
  const getCellFromMouse = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    return { x, y };
  };
  
  
  // Rendu automatique du canvas à chaque update du world
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!world) return;
    
    render(ctx, world, hoveredCell ?? undefined, hoveredStorage ?? undefined);
    if (conveyorPreview) {
      drawPreviewConveyor(ctx, conveyorPreview);
    }
    
  }, [hoveredCell, world.tick, hoveredStorage]);
  
  
  // Gestion du click sur le canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const y = Math.floor((e.clientY - rect.top) / cellSize);
      if (currentTool === "destroy") {
        destroyEntity(x,y);
        return
      }
      switch (selectedItem) {
        case "iron-mine":
          placeIronMine(x, y);
          break
        
        case "coal-mine":
          placeCoalMine(x, y);
          break
        
        case "water-pump":
          placeWaterPump(x, y);
          break
        
        case "storage":
          placeStorage(x, y);
          break
        
        default:
          return
      }
    }
    
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      dispatch(setSelectedItem(""));
      dispatch(setToolMode("build"));
      return
    }
    
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("contextmenu", handleRightClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("contextmenu", handleRightClick);
    }
  }, [world, cellSize, selectedItem,currentTool])
  
  // gestion du hover sur le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMove = (e: MouseEvent) => {
      if (selectedItem === "" && currentTool === "build") {
        setHoveredCell(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize)
      const y = Math.floor((e.clientY - rect.top) / cellSize)
      const canPlace = selectedItem !== "" ? world.grid!.canPlaceMachine({x, y}, selectedItem, world) : false;
      
      setHoveredCell({x, y, canPlace});
    }
    
    const handleLeave = () => setHoveredCell(null);
    
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
    }
  }, [selectedItem, cellSize, currentTool]);
  
  //Gestion du drag lors de la pose de tapis
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    
    const handleMouseDown = (e: MouseEvent) => {
      if (selectedItem !== "conveyor" || e.button === 2) return;
      setDragStart(getCellFromMouse(e, canvas));
    };
    
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStart) return;
      const end = getCellFromMouse(e, canvas);
      
      if (selectedItem === "conveyor") {
        const cells= getBestPath(dragStart, end, world);
        const conveyors = buildConveyorPlacements(cells);
        placeConveyorLine(conveyors);
      }
      setDragStart(null);
      setConveyorPreview(null)
    };
    
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragStart, cellSize, selectedItem]);
  
  // Gestion du preview d'ajout de convoyeur et du hover de coffre
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return
    const ctx = canvas.getContext("2d");
    if (!ctx) return
    const handleMouseMove = (e: MouseEvent) => {
      const current = getCellFromMouse(e, canvas)
      const storage = world.storages.find(
        s => s.x === current.x && s.y === current.y
      )
      setHoveredStorage(storage ?? null)
      
      if (!dragStart) return
      render(ctx, world);
      const cells = getBestPath(dragStart, current, world);
      const preview = buildConveyorPlacements(cells);
      setConveyorPreview(preview);
    }
    
    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, [dragStart, world]);
  
  
  
  return <canvas ref={canvasRef} width={width} height={height} style={{ border: "1px solid black"}} />
}