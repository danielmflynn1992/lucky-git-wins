import { useEffect, useState } from "react";

/**
 * PrizeImage — the ONLY sanctioned way to render a prize photo.
 *
 * Enforces the printed-stage treatment at render time so no upload can
 * bypass it: fixed 4:3 frame, cover crop, warm tint + halftone dots via
 * the .prize-treatment utility, 2px black rule border.
 *
 * If no src is provided, renders a typographic panel with the prize name
 * in Anton on coupon red — never an empty grey box.
 */
export function PrizeImage({
  src,
  alt,
  title,
  className = "",
  size = "hero",
  loading = "lazy",
  priority = false,
  eyebrow,
}: {
  src?: string | null;
  alt: string;
  /** Prize name — required for the typographic fallback. */
  title: string;
  className?: string;
  size?: "hero" | "card" | "thumb";
  loading?: "eager" | "lazy";
  priority?: boolean;
  eyebrow?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const hasSrc = !!(src && src.trim().length > 0) && !failed;
  return (
    <div
      className={`prize-treatment relative aspect-[4/3] w-full ${className}`}
      data-prize-image
      data-size={size}
    >
      {hasSrc ? (
        <img
          src={src ?? ""}
          alt={alt}
          loading={priority ? "eager" : loading}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          width={size === "thumb" ? 400 : 1280}
          height={size === "thumb" ? 300 : 960}
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <TypographicFallback title={title} eyebrow={eyebrow} size={size} />
      )}
    </div>
  );
}

function TypographicFallback({
  title,
  eyebrow,
  size,
}: {
  title: string;
  eyebrow?: string;
  size: "hero" | "card" | "thumb";
}) {
  const words = title.split(/\s+/).filter(Boolean);
  const fontSize =
    size === "thumb" ? "clamp(1rem, 8cqi, 1.6rem)" : size === "card" ? "clamp(1.4rem, 9cqi, 2.6rem)" : "clamp(2rem, 8cqi, 4.5rem)";
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-ink-red)] text-[var(--color-paper)] px-4 py-6 text-center [container-type:inline-size]"
      role="img"
      aria-label={title}
    >
      {eyebrow ? (
        <div className="font-body font-bold uppercase tracking-[0.22em] text-[10px] opacity-90">{eyebrow}</div>
      ) : null}
      <div
        className="font-display uppercase leading-[0.92] tracking-[0.01em] break-words hyphens-auto"
        style={{ fontSize }}
      >
        {words.map((w, i) => (
          <span key={i} className="block">{w}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * PrizeGallery — hero + up to 5 supporting images with a lightbox.
 */
export function PrizeGallery({
  hero,
  supporting = [],
  title,
  eyebrow,
}: {
  hero?: string | null;
  supporting?: string[];
  title: string;
  eyebrow?: string;
}) {
  const all = [hero, ...supporting].filter((x): x is string => !!x);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const current = all[active] ?? hero ?? null;

  return (
    <div>
      <button
        type="button"
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-red)]"
        onClick={() => (all.length ? setLightbox(active) : undefined)}
        aria-label={all.length ? `Open ${title} image ${active + 1} of ${all.length}` : title}
      >
        <PrizeImage src={current} alt={title} title={title} eyebrow={eyebrow} size="hero" priority />
      </button>

      {all.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {all.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              onDoubleClick={() => setLightbox(i)}
              aria-pressed={i === active}
              aria-label={`Show image ${i + 1}`}
              className={`shrink-0 w-20 sm:w-24 focus-visible:outline-none ${i === active ? "ring-2 ring-[var(--color-ink-red)]" : "opacity-80 hover:opacity-100"}`}
            >
              <PrizeImage src={src} alt="" title={title} size="thumb" />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          images={all}
          index={lightbox}
          title={title}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox(i)}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  index,
  title,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number;
  title: string;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, images.length, onClose, onIndex]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[color-mix(in_oklab,var(--color-ink-black)_92%,transparent)] backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image ${index + 1} of ${images.length}`}
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <PrizeImage src={images[index]} alt={title} title={title} size="hero" priority />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-[var(--color-paper)] text-[var(--color-ink-black)] border-2 border-[var(--color-ink-black)] font-bold"
          aria-label="Close"
        >
          ×
        </button>
        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-between text-[var(--color-paper)] font-mono text-xs">
            <button
              onClick={() => onIndex((index - 1 + images.length) % images.length)}
              className="px-3 py-1.5 border border-[var(--color-paper)]/50 hover:bg-[var(--color-paper)]/10"
            >
              ← Prev
            </button>
            <span>{index + 1} / {images.length}</span>
            <button
              onClick={() => onIndex((index + 1) % images.length)}
              className="px-3 py-1.5 border border-[var(--color-paper)]/50 hover:bg-[var(--color-paper)]/10"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
