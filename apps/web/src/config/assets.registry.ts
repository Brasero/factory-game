// Images importées pour que Vite les embarque dans le build : un chemin brut vers les sources
// n'existe plus une fois l'application construite.
import ironOre from "../assets/ore-nodeTiles/Materials/Iron/Ores/Ore-0003.png";
import coalOre from "../assets/ore-nodeTiles/Materials/Coal/Ores/Ore-0003.png";
import waterOre from "../assets/ore-nodeTiles/Materials/Water/Ores/water-item.png";
import ironPlate from "../assets/logistic/automation/iron-plate.png";
import conveyorUp from "../assets/logistic/conveyor/conveyor/conveyor-up.png";
import conveyorDown from "../assets/logistic/conveyor/conveyor/conveyor-down.png";
import conveyorLeft from "../assets/logistic/conveyor/conveyor/conveyor-left.png";
import conveyorRight from "../assets/logistic/conveyor/conveyor/conveyor-right.png";
import conveyorRightUp from "../assets/logistic/conveyor/conveyor/conveyor-right-up.png";
import conveyorLeftDown from "../assets/logistic/conveyor/conveyor/conveyor-left-down.png";
import conveyorLeftUp from "../assets/logistic/conveyor/conveyor/conveyor-left-up.png";
import conveyorRightDown from "../assets/logistic/conveyor/conveyor/conveyor-right-down.png";
import conveyorDownLeft from "../assets/logistic/conveyor/conveyor/conveyor-down-left.png";
import conveyorDownRight from "../assets/logistic/conveyor/conveyor/conveyor-down-right.png";
import conveyorUpLeft from "../assets/logistic/conveyor/conveyor/conveyor-up-left.png";
import conveyorUpRight from "../assets/logistic/conveyor/conveyor/conveyor-up-right.png";
import splitter from "../assets/logistic/conveyor/splitter/splitter.png";
import merger from "../assets/logistic/conveyor/combiner/combiner.png";
import miner1Idle from "../assets/machines/Miner_Machine_1.png";
import miner1Running from "../assets/machines/Miner_Machine_1_Running.png";
import miner2Idle from "../assets/machines/Miner_Machine_2.png";
import miner2Running from "../assets/machines/Miner_Machine_2_Running.png";
import waterPumpIdle from "../assets/machines/Water_Pump.png";
import waterPumpRunning from "../assets/machines/Water_Pump_Running.png";
import ironSmelterIdle from "../assets/machines/Stone_Furnace.png";
import ironSmelterRunning from "../assets/machines/Stone_Furnace_Active.png";
import ironSmelterParticles from "../assets/logistic/automation/iron-smelter-particles.png";
import assemblerIdle from "../assets/machines/Assembler_Machine_1.png";
import assemblerRunning from "../assets/machines/Assembler_Machine_1_Running.png";
import assemblerStandardIdle from "../assets/machines/Assembler_Machine_2.png";
import assemblerStandardRunning from "../assets/machines/Assembler_Machine_2_Running.png";
import assemblerIndustrialIdle from "../assets/machines/Assembler_Machine_3.png";
import assemblerIndustrialRunning from "../assets/machines/Assembler_Machine_3_Running.png";
import crate from "../assets/logistic/storage/crate.png";
import waterNode from "../assets/ore-nodeTiles/Materials/Water/Tiles/Water_Tileset.png";
import ironNode from "../assets/ore-nodeTiles/Materials/Iron/Tiles/Tile-0003.png";
import coalNode from "../assets/ore-nodeTiles/Materials/Coal/Tiles/Tile-0003.png";
import copperNode from "../assets/ore-nodeTiles/Materials/Copper/Tiles/Tile-0003.png";
import copperOre from "../assets/ore-nodeTiles/Materials/Copper/Ores/Ore-0003.png";
import environmentTileset from "../assets/ore-nodeTiles/Materials/Tiles/Environment_Tileset.png";
import treesTileset from "../assets/ore-nodeTiles/Materials/Tiles/Trees.png";
import waterTileset from "../assets/ore-nodeTiles/Materials/Tiles/Water_Tileset.png";
import rockTileset from "../assets/ore-nodeTiles/Materials/Tiles/Rock_Tile.png";

export const imagePath = {
  ore: {
    ironOre,
    coalOre,
    copperOre,
    waterOre,
    ironPlate
  },
  conveyor: {
    up: conveyorUp,
    down: conveyorDown,
    left: conveyorLeft,
    right: conveyorRight,
    "right-up": conveyorRightUp,
    "left-down": conveyorLeftDown,
    "left-up": conveyorLeftUp,
    "right-down": conveyorRightDown,
    "down-left": conveyorDownLeft,
    "down-right": conveyorDownRight,
    "up-left": conveyorUpLeft,
    "up-right": conveyorUpRight,
  },
  router: {
    splitter,
    merger
  },
  machine: {
    miner: {
      miner1: {
        idle: miner1Idle,
        running: miner1Running,
      },
      miner2: {
        idle: miner2Idle,
        running: miner2Running,
      }
    },
    pump: {
      water: {
        idle: waterPumpIdle,
        running: waterPumpRunning
      }
    },
    automation: {
      ironSmelter: {
        idle: ironSmelterIdle,
        running: ironSmelterRunning
      },
      ironSmelterParticles,
      assembler: {
        eco: {idle: assemblerIdle, running: assemblerRunning},
        standard: {idle: assemblerStandardIdle, running: assemblerStandardRunning},
        industrial: {idle: assemblerIndustrialIdle, running: assemblerIndustrialRunning}
      }
    }
  },
  storage: {
    crate
  },
  node: {
    water: waterNode,
    iron: ironNode,
    coal: coalNode,
    copper: copperNode
  },
  tileset: {
    environment: environmentTileset,
    trees: treesTileset,
    water: waterTileset,
    rock: rockTileset
  }
} as const;
