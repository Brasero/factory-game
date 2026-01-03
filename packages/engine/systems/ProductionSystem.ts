import {World} from "../models/World";

export function runProduction(world: World): World {
    const machines = world.machines.map((m) => {
        if (
          m.type !== "iron-mine" &&
          m.type !== "coal-mine" &&
          m.type !== "water-pump"
        ) return m;
        const buffer = {...(m.buffer ?? {})};
        let progress = m.progress;
        const resource =
          m.type === "iron-mine" ? "iron" :
            m.type === "coal-mine" ? "coal" :
              m.type === "water-pump" && "water"
        
        const current = buffer[resource] || 0;
        const totalStored = Object.values(buffer).reduce((a,b) => a+b, 0);
        
        // buffer plein, on arrête la production
        if (totalStored >= m.capacity) {
            return m;
        }
        progress += 1;
        
        if (progress >= 10) {
            buffer[resource] = current + 1;
            progress = 0;
        }
        
        return {
            ...m,
            buffer,
            progress
        };
    })
    return {
        ...world,
        machines: machines
    }
}