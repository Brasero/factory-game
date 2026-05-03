import type {World} from "../models/World";
import type {Resources, ResourcesType} from "@engine/models/Resources.ts";

export function runProduction(world: World): World {
    /* todo : a modifier, il est necessaire de mettre en place un systeme de production plus maintenable et permettant d'ajouter simplement d'autres machines (ex: centrale électrique, etc)
    le design pattern "Strategy" pourrait être une bonne solution : chaque machine aurait sa propre logique de production, et on pourrait facilement ajouter de nouvelles machines en créant de nouvelles stratégies de production
    */
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
              "water";
        
        const current = buffer[resource] || 0;
        const totalStored = Object.values(buffer).reduce((a,b) => a+b, 0);

        // buffer plein, on arrête la production
        if (totalStored >= m.capacity) {
            return {...m, active: false};
        }
        progress += m.efficiency;

        if (progress >= 10) {
            buffer[resource] = current + m.production;
            progress = 0;
        }

        return {
            ...m,
            buffer,
            progress,
            active: true
        };
    })
    const resource: Resources = {
        water: 0,
        iron: 0,
        coal: 0
    }
     world.storages.forEach((s) => {
         const entries = Object.entries(resource) as [ResourcesType, number][]
         entries.forEach(([key]) => {
             resource[key] += s.stored[key] || 0
         })
    })
    return {
        ...world,
        machines: machines,
        resources: resource
    }
}