import {GameEngine} from "@engine/core/GameEngine.ts";
import {createWorld} from "@engine/world/WorldFactory.ts";
import {snapshotWorld} from "@engine/core/snapshot.ts";
import type {EngineCommand, WorldSnapshot, SelectedItem} from "@engine/api/types.ts";

export class GameSession {
  private engine: GameEngine;

  constructor() {
    this.engine = new GameEngine(createWorld());
  }

  tick(): void {
    this.engine.tick();
  }

  dispatch(command: EngineCommand): boolean {
    switch (command.type) {
      case "place-machine":
        return this.engine.placeMachine(
          command.x,
          command.y,
          command.machineType
        );
      case "place-conveyor":
        return this.engine.placeConveyor(
          command.x,
          command.y,
          command.direction
        );
      case "place-storage":
        return this.engine.placeStorage(command.x, command.y);
      case "destroy-entity":
        this.engine.destroyEntityAt(command.x, command.y);
        return true;
      default:
        return false;
    }
  }

  canPlaceMachine(x: number, y: number, machineType: SelectedItem): boolean {
    const world = this.engine.getWorld();
    if (machineType === "conveyor") {
      const blocked =
        world.machines.some(m => m.x === x && m.y === y) ||
        world.storages.some(s => s.x === x && s.y === y);
      if (blocked) return false;
      if (world.conveyors.some(c => c.x === x && c.y === y)) return true;
    }
    if (!world.grid) return false;
    return world.grid.canPlaceMachine({x, y}, machineType, world);
  }

  getSnapshot(): WorldSnapshot {
    return snapshotWorld(this.engine.getWorld());
  }
}

export function createSession(): GameSession {
  return new GameSession();
}
