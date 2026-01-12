import {useEffect, useRef, useState, WheelEvent} from "react";
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
import { buildConveyorPlacements, getBestPath} from "@web/render/utils/canvas.ts";
import type {Camera} from "@web/model/Camera.ts";

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
  const cameraRef = useRef<Camera>({
    scale: 1,
    minScale: 0.5,
    maxScale: 2.5,
    x: 0,
    y: 0,
  })
 
  
  const getCellFromMouse = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const camera = cameraRef.current;
    
    // Coordonées écran -> canvas
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Inversion exacte de la transformation canvas
    const worldX = (screenX - camera.x) / camera.scale;
    const worldY = (screenY - camera.y) / camera.scale;
    return {
      x: Math.floor(worldX / cellSize),
      y: Math.floor(worldY / cellSize)
    };
  };
  
  
  // Rendu automatique du canvas à chaque update du world
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!world) return;
    
    render(ctx, world, cameraRef.current,hoveredCell ?? undefined, hoveredStorage ?? undefined);
    if (conveyorPreview) {
      drawPreviewConveyor(ctx, conveyorPreview);
    }
    
  }, [hoveredCell, world.tick, hoveredStorage]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const camera = cameraRef.current
      const zoomFactor = 1.1;
      const direction = e.deltaY > 0 ? -1 : 1;
      const oldScale = camera.scale;
      
      const newScale = Math.min(
        camera.maxScale,
        Math.max(camera.minScale, oldScale * (direction > 0 ? zoomFactor : 1 / zoomFactor))
      );
      
      if (newScale === oldScale) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      camera.x = mouseX - ((mouseX - camera.x) * newScale) / oldScale;
      camera.y = mouseY - ((mouseY - camera.y) * newScale) / oldScale;
      camera.scale = newScale
      render(canvas.getContext("2d"), world, camera);
    };
    
    canvas.addEventListener("wheel", handleWheel, {passive: false});
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);
  
  // Gestion du click sur le canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    
    const handleClick = (e: MouseEvent) => {
      const {x, y} = getCellFromMouse(e, canvas);
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
      const {x, y} = getCellFromMouse(e, canvas);
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
      const cells = getBestPath(dragStart, current, world);
      const preview = buildConveyorPlacements(cells);
      setConveyorPreview(preview);
    }
    
    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, [dragStart, world]);
  
  
  
  return <canvas ref={canvasRef} width={width} height={height} style={{ border: "1px solid black"}} />
}