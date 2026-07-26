/**
 * Prize-image optimizer — runs entirely in the browser.
 *
 * Pipeline:
 *  1. Decode the source file.
 *  2. Sample the border to detect a near-uniform background. If confidence is
 *     high, flatten to warm paper (the stage treatment supplies the halftone).
 *  3. Centre-crop to 4:3, downscale to fit maxEdge, encode WEBP under target.
 *  4. Also encode a 400px thumbnail for card use.
 */

export type OptimizeOptions = {
  maxEdge?: number;
  targetBytes?: number;
  startQuality?: number;
  minQuality?: number;
  cropToFourThree?: boolean;
  thumbEdge?: number;
  flattenBackground?: boolean;
};

export type OptimizeResult = {
  blob: Blob;
  filename: string;
  contentType: string;
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
  quality: number;
  converted: boolean;
  bgConfidence: number;
  flattened: boolean;
  sourceWidth: number;
  thumb?: {
    blob: Blob;
    filename: string;
    contentType: string;
    width: number;
    height: number;
  };
};

const DEFAULTS: Required<OptimizeOptions> = {
  maxEdge: 1600,
  targetBytes: 300 * 1024,
  startQuality: 0.82,
  minQuality: 0.55,
  cropToFourThree: true,
  thumbEdge: 400,
  flattenBackground: true,
};

// Warm cream fill matching the printed stage. Halftone dots come from CSS.
const PAPER_FILL = "#F1E7CE";

async function decode(file: File): Promise<{ bitmap: ImageBitmap | HTMLImageElement; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not decode image"));
      i.src = url;
    });
    return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function fourThreeCrop(srcW: number, srcH: number) {
  const targetRatio = 4 / 3;
  const srcRatio = srcW / srcH;
  if (Math.abs(srcRatio - targetRatio) < 0.01) return { sx: 0, sy: 0, sw: srcW, sh: srcH };
  if (srcRatio > targetRatio) {
    // Too wide → crop sides.
    const sw = Math.round(srcH * targetRatio);
    const sx = Math.round((srcW - sw) / 2);
    return { sx, sy: 0, sw, sh: srcH };
  }
  // Too tall → crop top/bottom.
  const sh = Math.round(srcW / targetRatio);
  const sy = Math.round((srcH - sh) / 2);
  return { sx: 0, sy, sw: srcW, sh };
}

function drawTo(
  source: ImageBitmap | HTMLImageElement,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  cropToFourThree: boolean,
  fill?: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, destW, destH);
  }
  if (cropToFourThree) {
    const { sx, sy, sw, sh } = fourThreeCrop(srcW, srcH);
    ctx.drawImage(source as CanvasImageSource, sx, sy, sw, sh, 0, 0, destW, destH);
  } else {
    ctx.drawImage(source as CanvasImageSource, 0, 0, destW, destH);
  }
  return canvas;
}

/**
 * Sample the outer border and score how uniform it is.
 * Returns { confidence 0-1, mean [r,g,b] }.
 */
function detectBackground(canvas: HTMLCanvasElement): { confidence: number; mean: [number, number, number] } {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { confidence: 0, mean: [255, 255, 255] };
  const w = canvas.width;
  const h = canvas.height;
  const strip = Math.max(2, Math.round(Math.min(w, h) * 0.04));
  const samples: number[][] = [];
  const grab = (x: number, y: number, sw: number, sh: number) => {
    const d = ctx.getImageData(x, y, sw, sh).data;
    for (let i = 0; i < d.length; i += 16) samples.push([d[i], d[i + 1], d[i + 2]]);
  };
  grab(0, 0, w, strip);
  grab(0, h - strip, w, strip);
  grab(0, 0, strip, h);
  grab(w - strip, 0, strip, h);
  if (samples.length === 0) return { confidence: 0, mean: [255, 255, 255] };
  let r = 0, g = 0, b = 0;
  for (const s of samples) { r += s[0]; g += s[1]; b += s[2]; }
  r /= samples.length; g /= samples.length; b /= samples.length;
  // variance
  let v = 0;
  for (const s of samples) {
    const dr = s[0] - r, dg = s[1] - g, db = s[2] - b;
    v += dr * dr + dg * dg + db * db;
  }
  v /= samples.length;
  // Std dev per channel. <8 = very uniform, >30 = busy.
  const std = Math.sqrt(v / 3);
  const uniform = Math.max(0, Math.min(1, 1 - (std - 6) / 22));
  return { confidence: uniform, mean: [r, g, b] };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

async function encodeUnderBudget(
  canvas: HTMLCanvasElement,
  targetBytes: number,
  startQuality: number,
  minQuality: number,
): Promise<{ blob: Blob; quality: number; contentType: "image/webp" | "image/jpeg" } | null> {
  let quality = startQuality;
  let contentType: "image/webp" | "image/jpeg" = "image/webp";
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  if (!blob) {
    contentType = "image/jpeg";
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }
  if (!blob) return null;
  const step = 0.08;
  while (blob && blob.size > targetBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - step);
    const next = await canvasToBlob(canvas, contentType, quality);
    if (!next) break;
    blob = next;
  }
  return { blob, quality, contentType };
}

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<OptimizeResult> {
  const cfg = { ...DEFAULTS, ...opts };
  const originalBytes = file.size;
  const { bitmap, width: srcW, height: srcH } = await decode(file);

  // Target dimensions: 4:3, clamped to maxEdge.
  const cropDims = cfg.cropToFourThree ? fourThreeCrop(srcW, srcH) : { sw: srcW, sh: srcH };
  const scale = Math.min(1, cfg.maxEdge / Math.max(cropDims.sw, cropDims.sh));
  const destW = Math.round(cropDims.sw * scale);
  const destH = Math.round(cropDims.sh * scale);

  // First pass — draw without fill so we can measure the source background.
  const probe = drawTo(bitmap, srcW, srcH, destW, destH, cfg.cropToFourThree);
  const { confidence, mean } = detectBackground(probe);

  // High confidence + light near-uniform → flatten onto warm paper so every
  // hero blends into the printed stage. Skip dark or coloured backgrounds.
  const light = (mean[0] + mean[1] + mean[2]) / 3 > 210;
  const shouldFlatten = cfg.flattenBackground && confidence > 0.7 && light;

  let mainCanvas = probe;
  if (shouldFlatten) {
    mainCanvas = drawTo(bitmap, srcW, srcH, destW, destH, cfg.cropToFourThree, PAPER_FILL);
  }

  // Thumbnail — always centre-cropped 4:3 to match card frame.
  const tScale = Math.min(1, cfg.thumbEdge / Math.max(cropDims.sw, cropDims.sh));
  const tW = Math.round(cropDims.sw * tScale);
  const tH = Math.round(cropDims.sh * tScale);
  const thumbCanvas = drawTo(bitmap, srcW, srcH, tW, tH, cfg.cropToFourThree, shouldFlatten ? PAPER_FILL : undefined);

  if ("close" in bitmap && typeof (bitmap as ImageBitmap).close === "function") {
    (bitmap as ImageBitmap).close();
  }

  const encoded = await encodeUnderBudget(mainCanvas, cfg.targetBytes, cfg.startQuality, cfg.minQuality);
  if (!encoded) {
    return {
      blob: file,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      width: srcW,
      height: srcH,
      originalBytes,
      optimizedBytes: originalBytes,
      quality: 1,
      converted: false,
      bgConfidence: confidence,
      flattened: false,
      sourceWidth: srcW,
    };
  }

  const thumb = await encodeUnderBudget(thumbCanvas, 60 * 1024, 0.8, 0.55);

  const baseName = (file.name.replace(/\.[^.]+$/, "") || "cover").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const ext = encoded.contentType === "image/webp" ? "webp" : "jpg";

  return {
    blob: encoded.blob,
    filename: `${baseName}.${ext}`,
    contentType: encoded.contentType,
    width: mainCanvas.width,
    height: mainCanvas.height,
    originalBytes,
    optimizedBytes: encoded.blob.size,
    quality: encoded.quality,
    converted: true,
    bgConfidence: confidence,
    flattened: shouldFlatten,
    sourceWidth: srcW,
    thumb: thumb
      ? {
          blob: thumb.blob,
          filename: `${baseName}-thumb.${thumb.contentType === "image/webp" ? "webp" : "jpg"}`,
          contentType: thumb.contentType,
          width: thumbCanvas.width,
          height: thumbCanvas.height,
        }
      : undefined,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
