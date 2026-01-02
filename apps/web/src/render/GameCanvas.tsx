import {useEffect, useRef, useState} from "react";
import {useAppSelector, useAppDispatch} from "@web/store/hooks.ts";
import {render} from "@web/render/CanvasRenderer.ts";
import type {World} from "@engine/models/World.ts";
import {placeCoalMine, placeIronMine, placeWaterPump} from "@web/game/GameController.ts";
import {selectGameState, selectSelectedItem} from "@web/store/selectors.ts";
import {setSelectedItem} from "@web/store/controlSlice.ts";
import type {Position} from "@engine/models/Position.ts";

interface GameCanvasProps {
  width: number;
  height: number;
  cellSize: number;
}

export function GameCanvas({ width, height, cellSize }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world: World = useAppSelector(selectGameState);
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);
  const [hoveredCell, setHoveredCell] = useState<Position & {canPlace: boolean} | null>(null);
  
  // Rendu automatique du canvas à chaque update du world
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!world) return;
    
    render(ctx, world, hoveredCell ?? undefined);
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
      dispatch(setSelectedItem(""))
    }
    
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
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
  
  return <canvas ref={canvasRef} width={width} height={height} style={{ border: "1px solid black"}} />
}