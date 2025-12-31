import './App.css'
import {useEffect, useRef} from "react";
import {startGame, placeIronMine} from "./game/GameController.ts";
import {useSelector} from "react-redux";
import {render} from "./render/CanvasRenderer.ts";
import type {World} from "../../../packages/engine/models/World.ts";
import {Hud} from "./ui/Hud.tsx";

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        startGame();
    }, []);

    const world: World = useSelector((s: any) => s.game);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (!world) return;

        render(ctx, world);
    }, [world]);

  return (
    <div>
        <Hud />
        <canvas width={800} height={600} ref={canvasRef} />
        <button onClick={() => placeIronMine(3, 2)}>Ajouter une mine de fer</button>
    </div>
  )
}

export default App
