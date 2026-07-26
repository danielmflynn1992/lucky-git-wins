/**
 * Client-side image optimizer for competition cover uploads.
 *
 * - Decodes the source file with the browser image decoder.
 * - Downscales to fit within `maxEdge` px on the longest side (retina-safe).
 * - Encodes to WEBP via canvas.toBlob, iteratively reducing quality until
 *   the result is under `targetBytes` (or we've reached the quality floor).
 * - Falls back to the original file if WEBP encoding isn't supported or the
 *   optimized output would be *larger* than the source.
 *
 * Runs entirely in the browser — no server round-trip, no dependencies.
 */

export type OptimizeOptions = {
  /** Longest-edge cap in CSS pixels. Cards render at ~1200px max. */
  maxEdge?: number;
  /** Target file size in bytes. Quality drops until we're under this. */
  targetBytes?: number;
  /** Initial WEBP quality (0–1). */
  startQuality?: number;
  /** Lowest quality we'll settle for before giving up. */
  minQuality?: number;
  /** Force a 4:3 centre crop before encoding. Default true. */
  cropToFourThree?: boolean;
  /** Also produce a small square-ish thumbnail (max edge px). */
  thumbEdge?: number;
  /** Detect near-uniform background and flatten to warm paper. */
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
  /** Detected uniform-background confidence, 0-1. */
  bgConfidence: number;
  /** True if we flattened the background onto cream paper. */
  flattened: boolean;
  /** Optional thumbnail blob + filename. */
  thumb?: { blob: Blob; filename: string; contentType: string; width: number; height: number };
  /** Source pixel width — used to warn on tiny uploads. */
  sourceWidth: number;
};

const DEFAULTS: Required<OptimizeOptions> = {
  maxEdge: 1600,
  targetBytes: 350 * 1024,
  startQuality: 0.82,
  minQuality: 0.55,
  cropToFourThree: true,
  thumbEdge: 400,
  flattenBackground: true,
};

async function decode(file: File): Promise<{ bitmap: ImageBitmap | HTMLImageElement; width: number; height: number }>
{
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return { bitmap, width: bitmap.width, height: bitmap.height };
  }
  // Safari fallback
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
    // Revoke after the canvas has drawn — caller handles that timing
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function drawScaled(
  source: ImageBitmap | HTMLImageElement,
  srcW: number,
  srcH: number,
  maxEdge: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<OptimizeResult> {
  const cfg = { ...DEFAULTS, ...opts };
  const originalBytes = file.size;

  const { bitmap, width, height } = await decode(file);
  const canvas = drawScaled(bitmap, width, height, cfg.maxEdge);
  // Release GPU memory when we can.
  if ("close" in bitmap && typeof (bitmap as ImageBitmap).close === "function") {
    (bitmap as ImageBitmap).close();
  }

  let quality = cfg.startQuality;
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  // Some browsers (older Safari) return null for image/webp → fall back to JPEG.
  let contentType: "image/webp" | "image/jpeg" = "image/webp";
  if (!blob) {
    contentType = "image/jpeg";
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }
  if (!blob) {
    return {
      blob: file,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      width,
      height,
      originalBytes,
      optimizedBytes: originalBytes,
      quality: 1,
      converted: false,
    };
  }

  // Iteratively reduce quality until we hit the size budget.
  const step = 0.08;
  while (blob && blob.size > cfg.targetBytes && quality > cfg.minQuality) {
    quality = Math.max(cfg.minQuality, quality - step);
    const next = await canvasToBlob(canvas, contentType, quality);
    if (!next) break;
    blob = next;
  }

  // If our "optimized" output somehow ended up larger, keep the original.
  if (blob.size >= originalBytes && file.type.startsWith("image/")) {
    return {
      blob: file,
      filename: file.name,
      contentType: file.type,
      width,
      height,
      originalBytes,
      optimizedBytes: originalBytes,
      quality: 1,
      converted: false,
    };
  }

  const baseName = (file.name.replace(/\.[^.]+$/, "") || "cover").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const ext = contentType === "image/webp" ? "webp" : "jpg";
  return {
    blob,
    filename: `${baseName}.${ext}`,
    contentType,
    width: canvas.width,
    height: canvas.height,
    originalBytes,
    optimizedBytes: blob.size,
    quality,
    converted: true,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}