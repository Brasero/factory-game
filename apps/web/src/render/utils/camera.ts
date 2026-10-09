import type {Camera} from "@web/model/Camera";
import type {Position} from "@engine/models/Position";

export function canvasPoint(clientX: number, clientY: number, rect: Pick<DOMRect, "left" | "top" | "width" | "height">, width: number, height: number): Position {
  return {x: (clientX - rect.left) * (rect.width ? width / rect.width : 1),
    y: (clientY - rect.top) * (rect.height ? height / rect.height : 1)};
}
export function worldPoint(point: Position, camera: Camera, cellSize: number): Position {
  return {x: (point.x - camera.x) / camera.scale / cellSize, y: (point.y - camera.y) / camera.scale / cellSize};
}
export function centerCamera(camera: Camera, center: Position, width: number, height: number, cellSize: number): void {
  camera.x = width / 2 - center.x * cellSize * camera.scale;
  camera.y = height / 2 - center.y * cellSize * camera.scale;
}
export function zoomCamera(camera: Camera, point: Position, delta: number): void {
  const scale = Math.min(camera.maxScale, Math.max(camera.minScale, camera.scale * (delta > 0 ? 1 / 1.1 : 1.1)));
  camera.x = point.x - (point.x - camera.x) * scale / camera.scale;
  camera.y = point.y - (point.y - camera.y) * scale / camera.scale;
  camera.scale = scale;
}
