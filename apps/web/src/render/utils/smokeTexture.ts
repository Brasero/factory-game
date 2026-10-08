/** Textures adoucies une seule fois, indépendamment du zoom et de la taille du viewport. */
const smokeTextures = new WeakMap<HTMLImageElement, OffscreenCanvas[]>();
let cornerTexture: OffscreenCanvas | undefined;

export function getSmokeTextures(image: HTMLImageElement): OffscreenCanvas[] | undefined {
  const cached = smokeTextures.get(image);
  if (cached) return cached;
  if (typeof OffscreenCanvas === "undefined" || !image.naturalWidth || !image.naturalHeight) return undefined;
  const frames: OffscreenCanvas[] = [];
  for (let index = 0; index < 4; index++) {
    const frame = new OffscreenCanvas(256, 256);
    const ctx = frame.getContext("2d");
    if (!ctx) return undefined;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, index % 2 * image.naturalWidth / 2, Math.floor(index / 2) * image.naturalHeight / 2,
      image.naturalWidth / 2, image.naturalHeight / 2, 0, 0, 256, 256);
    // Le masque atteint zéro AVANT les bords du PNG, même si le sprite les touche.
    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createRadialGradient(128, 128, 0, 128, 128, 124);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(0.4, "rgba(0,0,0,0.95)");
    mask.addColorStop(0.72, "rgba(0,0,0,0.45)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, 256, 256);
    frames.push(frame);
  }
  smokeTextures.set(image, frames);
  return frames;
}

export function getCornerSmokeTexture(): OffscreenCanvas | undefined {
  if (cornerTexture) return cornerTexture;
  if (typeof OffscreenCanvas === "undefined") return undefined;
  const frame = new OffscreenCanvas(256, 256);
  const ctx = frame.getContext("2d");
  if (!ctx) return undefined;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(40,38,36,1)");
  gradient.addColorStop(0.58, "rgba(67,62,57,0.48)");
  gradient.addColorStop(1, "rgba(78,72,66,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  cornerTexture = frame;
  return frame;
}
