import {useSyncExternalStore} from "react";

let revision = 0;
const listeners = new Set<() => void>();
export function requestCameraFocus() { revision++; listeners.forEach(listener => listener()); }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useCameraFocusRevision() { return useSyncExternalStore(subscribe, () => revision); }
