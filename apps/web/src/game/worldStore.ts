import {useSyncExternalStore} from "react";
import type {WorldSnapshot} from "@engine/api/types.ts";

type WorldListener = () => void;

const listeners = new Set<WorldListener>();
let snapshot: WorldSnapshot | null = null;

export function setWorldSnapshot(next: WorldSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function getWorldSnapshot(): WorldSnapshot {
  if (!snapshot) {
    throw new Error("World snapshot is not initialized.");
  }
  return snapshot;
}

export function subscribeWorld(listener: WorldListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWorldSnapshot(): WorldSnapshot {
  return useSyncExternalStore(subscribeWorld, getWorldSnapshot);
}

export function useWorldSelector<T>(selector: (world: WorldSnapshot) => T): T {
  return useSyncExternalStore(subscribeWorld, () => selector(getWorldSnapshot()));
}
