import {GameEngine} from "@engine/core/GameEngine.ts";
import {createWorld} from "@engine/world/WorldFactory.ts";
import type {
  EngineCommand,
  SelectedItem,
  WorldSnapshot
} from "@engine/api/types.ts";
import type {MachineVariant} from "@engine/models/Machine";
import type {GameSave} from "./saveGame";
import {restoreWorld, serializeWorld} from "./saveGame";

export class GameSession {
  private engine: GameEngine;

  constructor(save?: GameSave) {
    this.engine = new GameEngine(save ? restoreWorld(save) : createWorld());
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
          command.machineType,
          command.variant
        );
      case "place-conveyor":
        return this.engine.placeConveyor(
          command.x,
          command.y,
          command.direction,
          command.conveyorType
        );
      case "place-storage":
        return this.engine.placeStorage(command.x, command.y);
      case "destroy-entity":
        return this.engine.destroyEntityAt(command.x, command.y);
      case "activate-level":
        return this.engine.activateLevel(command.levelId);
      case "finalize-level":
        return this.engine.finalizeLevel(command.levelId);
      case "select-machine-recipe":
        return this.engine.selectMachineRecipe(command.machineId, command.recipeId);
      case "set-machine-paused":
        return this.engine.setMachinePaused(command.machineId, command.paused);
      default:
        return false;
    }
  }

  canPlaceMachine(x: number, y: number, machineType: SelectedItem, variant?: MachineVariant): boolean {
    return this.engine.canPlaceMachine(x, y, machineType, variant);
  }

  getSnapshot(): WorldSnapshot {
    return this.engine.getSnapshot();
  }

  createSave(): GameSave {
    return serializeWorld(this.engine.getWorld());
  }
}

export function createSession(save?: GameSave): GameSession {
  return new GameSession(save);
}
