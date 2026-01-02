import { describe, it, expect } from "vitest";
import {GameEngine} from "./GameEngine";
import {createWorld} from "../world/WorldFactory";

describe("GameEngine", () => {
  it("Doit s'initialiser avec un Monde", () => {
    const world = createWorld();
    const engine = new GameEngine(world);
    
    expect(engine.getWorld()).toBe(world);
    expect(engine.world.tick).toBe(0);
  });
  it("Doit incrémenter le tick du monde lors de l'appel de tick()", () => {
    const world = createWorld();
    const engine = new GameEngine(world);
    
    engine.tick();
    
    expect(engine.world.tick).toBe(1);
  });
  
  it("Doit lancer le systéme de production au tick", () => {
    const world = createWorld();
    const engine = new GameEngine(world);
    engine.getWorld().machines.push({
      id: "machine-1",
      type: "iron-mine",
      x: 0,
      y: 0
    })
    
    engine.tick();
    
    expect(engine.world.resources.iron).toBeGreaterThan(0);
  });
  
  it("Doit enchainer plusieurs tick correctement", () => {
    const world = createWorld();
    const engine = new GameEngine(world);
    engine.getWorld().machines.push({
      id: "machine-1",
      type: "iron-mine",
      x: 0,
      y: 0
    })
    
    engine.tick();
    engine.tick();
    engine.tick();
    
    expect(engine.world.tick).toBe(3);
    expect(engine.world.resources.iron).toBeGreaterThan(0);
  });
  
});