const assetsBasePath = "/apps/web/src/assets";
const materialBasePath = assetsBasePath + "/ore-nodeTiles/Materials";
const conveyorBasePath = assetsBasePath + "/logistic/conveyor/conveyor";
const machinesBasePath = assetsBasePath + "/machines";
const storageBasePath = assetsBasePath + "/logistic/storage";
export const imagePath = {
  ore: {
    ironOre: materialBasePath + "/Iron/Ores/Ore-0003.png",
    coalOre: materialBasePath + "/Coal/Ores/Ore-0003.png",
    waterOre: materialBasePath + "/Water/Ores/water-item.png"
  },
  conveyor: {
    up: conveyorBasePath + "/conveyor-up.png",
    down: conveyorBasePath + "/conveyor-down.png",
    left: conveyorBasePath + "/conveyor-left.png",
    right: conveyorBasePath + "/conveyor-right.png",
    "right-up": conveyorBasePath + "/conveyor-right-up.png",
    "left-down": conveyorBasePath + "/conveyor-left-down.png",
    "left-up": conveyorBasePath + "/conveyor-left-up.png",
    "right-down": conveyorBasePath + "/conveyor-right-down.png",
    "down-left": conveyorBasePath + "/conveyor-down-left.png",
    "down-right": conveyorBasePath + "/conveyor-down-right.png",
    "up-left": conveyorBasePath + "/conveyor-up-left.png",
    "up-right": conveyorBasePath + "/conveyor-up-right.png",
  },
  machine: {
    miner: {
      miner1: {
        idle: machinesBasePath + "/Miner_Machine_1.png",
        running: machinesBasePath + "/Miner_Machine_1_Running.png",
      },
      miner2: {
        idle: machinesBasePath + "/Miner_Machine_2.png",
        running: machinesBasePath + "/Miner_Machine_2_Running.png",
      }
    },
    pump: {
      water: {
        idle: machinesBasePath + "/Water_Pump.png",
        running: machinesBasePath + "/Water_Pump_running.png"
      }
    }
  },
  storage: {
    crate: storageBasePath + "/crate.png"
  },
  node: {
    water: materialBasePath + "/Water/Tiles/Water_Tileset.png",
    iron: materialBasePath + "/Iron/Tiles/Tile-0003.png",
    coal: materialBasePath + "/Coal/Tiles/Tile-0003.png"
  }
} as const;