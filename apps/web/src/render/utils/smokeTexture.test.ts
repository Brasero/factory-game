import {afterEach, expect, it, vi} from "vitest";
import {getSmokeTextures} from "./smokeTexture";

afterEach(() => vi.unstubAllGlobals());

it("masks all four atlas frames to transparent edges once, then reuses them", () => {
  const contexts: {drawImage: ReturnType<typeof vi.fn>; fillRect: ReturnType<typeof vi.fn>;
    createRadialGradient: ReturnType<typeof vi.fn>; globalCompositeOperation: string}[] = [];
  const stops: [number, string][] = [];
  vi.stubGlobal("OffscreenCanvas", class {
    getContext() {
      const ctx = {drawImage: vi.fn(), fillRect: vi.fn(), globalCompositeOperation: "source-over",
        createRadialGradient: vi.fn(() => ({addColorStop: (offset: number, color: string) => stops.push([offset, color])}))};
      contexts.push(ctx);
      return ctx;
    }
  });
  const image = {naturalWidth: 512, naturalHeight: 512} as HTMLImageElement;
  const frames = getSmokeTextures(image)!;
  expect(frames).toHaveLength(4);
  expect(getSmokeTextures(image)).toBe(frames);
  expect(contexts).toHaveLength(4);
  contexts.forEach(ctx => {
    expect(ctx.globalCompositeOperation).toBe("destination-in");
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
    expect(ctx.createRadialGradient).toHaveBeenCalledWith(128, 128, 0, 128, 128, 124);
  });
  expect(stops.filter(([offset, color]) => offset === 1 && color === "rgba(0,0,0,0)")).toHaveLength(4);
  expect(contexts[3].drawImage).toHaveBeenCalledWith(image, 256, 256, 256, 256, 0, 0, 256, 256);
});

it("does not cache an unloaded image", () => {
  expect(getSmokeTextures({naturalWidth: 0, naturalHeight: 0} as HTMLImageElement)).toBeUndefined();
});
