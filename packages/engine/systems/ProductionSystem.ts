import type {World} from "../models/World";
import {MACHINE_RECIPES} from "@engine/config/recipeConfig";

export function runProduction(world: World): World {
    /* todo : a modifier, il est necessaire de mettre en place un systeme de production plus maintenable et permettant d'ajouter simplement d'autres machines (ex: centrale électrique, etc)
    le design pattern "Strategy" pourrait être une bonne solution : chaque machine aurait sa propre logique de production, et on pourrait facilement ajouter de nouvelles machines en créant de nouvelles stratégies de production
    */
    const machines = world.machines.map((m) => {
        const recipe = MACHINE_RECIPES[m.type];
        if (recipe) {
            const buffer = {...(m.buffer ?? {})};
            const totalStored = Object.values(buffer).reduce((a,b) => a+b, 0);
            if ((buffer[recipe.input] ?? 0) <= 0 || totalStored >= m.capacity) {
                return {...m, active: false};
            }
            const progress = m.progress + m.efficiency;
            if (progress < recipe.duration) {
                return {...m, buffer, progress, active: true};
            }
            buffer[recipe.input] = (buffer[recipe.input] ?? 1) - 1;
            buffer[recipe.output] = (buffer[recipe.output] ?? 0) + m.production;
            return {...m, buffer, progress: 0, active: true};
        }
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
            buffer[resource] = current + Math.min(m.production, m.capacity - totalStored);
            progress = 0;
        }

        return {
            ...m,
            buffer,
            progress,
            active: true
        };
    })
    return {...world, machines};
}