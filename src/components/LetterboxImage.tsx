import type { CSSProperties } from "react";

export type LetterboxStyle = "solid" | "gradient" | "blur";

type Props = {
  src: string;
  alt: string;
  style?: LetterboxStyle;
  /** Extra classes for the outer aspect-ratio frame (e.g. `aspect-[5/4] rounded-lg`). */
  className?: string;
  /** Extra classes applied to the foreground <img>. */
  imgClassName?: string;
  /** Sub-pixel blur strength for the blur variant. */
  blur?: "sm" | "md" | "lg";
  loading?: "eager" | "lazy";
  width?: number;
  height?: number;
};

/**
 * Renders an image inside a fixed-aspect frame without cropping.
 * The empty letterboxed area is filled according to `style`:
 *  - solid   → flat neutral background (bg-muted)
 *  - gradient→ warm brand gradient (cream → gold-tinted)
 *  - blur    → soft blurred copy of the same image (default)
 */
export function LetterboxImage({
  src,
  alt,
  style = "blur",
  className = "",
  imgClassName = "",
  blur = "lg",
  loading = "lazy",
  width,
  height,
}: Props) {
  const blurClass = blur === "sm" ? "blur-md" : blur === "md" ? "blur-xl" : "blur-2xl";
  const gradientStyle: CSSProperties =
    style === "gradient"
      ? {
          backgroundImage:
            "linear-gradient(135deg, hsl(var(--cream)) 0%, hsl(var(--gold) / 0.35) 55%, hsl(var(--clover) / 0.25) 100%)",
        }
      : {};
  return (
    <div
      className={`relative overflow-hidden ${style === "solid" || style === "gradient" ? "bg-muted" : "bg-muted"} ${className}`}
      style={gradientStyle}
      data-letterbox={style}
    >
      {style === "blur" && src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover scale-110 ${blurClass} opacity-60`}
        />
      )}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          width={width}
          height={height}
          className={`relative h-full w-full object-contain ${imgClassName}`}
        />
      ) : null}
    </div>
  );
}