import {GameEngine} from "@engine/core/GameEngine.ts";
import {createWorld} from "@engine/world/WorldFactory.ts";
import type {
  EngineCommand,
  SelectedItem,
  WorldSnapshot
} from "@engine/api/types.ts";

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
          command.direction,
          command.conveyorType
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
    return this.engine.canPlaceMachine(x, y, machineType);
  }

  getSnapshot(): WorldSnapshot {
    return this.engine.getSnapshot();
  }
}

export function createSession(): GameSession {
  return new GameSession();
}
