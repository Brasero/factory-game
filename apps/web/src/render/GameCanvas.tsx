import {useEffect, useRef, useState} from "react";
import {useAppSelector, useAppDispatch} from "@web/store/hooks.ts";
import {drawPreviewConveyor, render} from "@web/render/CanvasRenderer.ts";
import type {World} from "@engine/models/World.ts";
import {placeCoalMine, placeConveyor, placeIronMine, placeWaterPump} from "@web/game/GameController.ts";
import {selectGameState, selectSelectedItem} from "@web/store/selectors.ts";
import {setSelectedItem} from "@web/store/controlSlice.ts";
import type {Position} from "@engine/models/Position.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {MachineType} from "@engine/models/Machine.ts";
import {loadConveyorSpriteSheet} from "@web/render/SpriteSheetLoader.ts";

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
  const [loading, setLoading] = useState<boolean>(true);
  const world: World = useAppSelector(selectGameState);
  const dispatch = useAppDispatch();
  const selectedItem: MachineType = useAppSelector(selectSelectedItem);
  const [hoveredCell, setHoveredCell] = useState<Position & {canPlace: boolean} | null>(null);
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const [conveyorPreview, setConveyorPreview] = useState<ConveyorPreview | null>(null);
  
  const calcDirection = (current: Position): DirectionType => {
    if (!dragStart) return "right";
    const dx = current.x - dragStart.x;
    const dy = current.y - dragStart.y;
    
    let direction: DirectionType = "right";
    if (Math.abs(dx) > Math.abs(dy)) direction = dx > 0 ? "right" : "left";
    else if (Math.abs(dy) > 0) direction = dy > 0 ? "down" : "up";
    return direction;
  }
  
  const getCellFromMouse = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    return { x, y };
  };
  
  useEffect(() => {
    setLoading(true)
    loadConveyorSpriteSheet().then(() => {
      setLoading(false)
    })
  }, []);
  
  // Rendu automatique du canvas à chaque update du world
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!world) return;
    
    render(ctx, world, hoveredCell ?? undefined);
    if (conveyorPreview) {
      drawPreviewConveyor(ctx, conveyorPreview.x, conveyorPreview.y, conveyorPreview.direction);
    }
  }, [hoveredCell, world]);
  
  
  // Gestion du click sur le canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const y = Math.floor((e.clientY - rect.top) / cellSize);
      
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
        
        default:
          return
      }
    }
    
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      dispatch(setSelectedItem(""));
      return
    }
    
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("contextmenu", handleRightClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("contextmenu", handleRightClick);
    }
  }, [world, cellSize, selectedItem])
  
  // gestion du hover sur le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMove = (e: MouseEvent) => {
      if (selectedItem === "") {
        setHoveredCell(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize)
      const y = Math.floor((e.clientY - rect.top) / cellSize)
      const canPlace = selectedItem ? world.grid!.canPlaceMachine({x, y}, selectedItem, world) : false;
      
      setHoveredCell({x, y, canPlace});
    }
    
    const handleLeave = () => setHoveredCell(null);
    
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
    }
  }, [selectedItem, cellSize]);
  
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
      
      const dx = end.x - dragStart.x;
      const dy = end.y - dragStart.y;
      
      let direction: DirectionType = "right"; // valeur par défaut
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "right" : "left";
      } else if (Math.abs(dy) > 0) {
        direction = dy > 0 ? "down" : "up";
      }
      
      if (selectedItem === "conveyor") {
        placeConveyor(dragStart.x, dragStart.y, direction);
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
  
  // Gestion du preview d'ajout de convoyeur
  useEffect(() => {
    if (!dragStart) return
    const canvas = canvasRef.current;
    if (!canvas) return
    const ctx = canvas.getContext("2d");
    if (!ctx) return
    const handleMouseMove = (e: MouseEvent) => {
      const current = getCellFromMouse(e, canvas)
      
      const direction: DirectionType = calcDirection(current as Position);
      render(ctx, world);
      setConveyorPreview({x: dragStart.x, y: dragStart.y, direction});
    }
    
    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, [dragStart, world]);
  
  if (loading) {
    return <h2>Chargement des assets...</h2>
  }
  
  return <canvas ref={canvasRef} width={width} height={height} style={{ border: "1px solid black"}} />
}