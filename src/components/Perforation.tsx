/**
 * Perforation — printed tear-off edge.
 */
import { cn } from "@/lib/utils";

export function Perforation({
  color = "currentColor",
  className,
  orientation = "horizontal",
}: {
  color?: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  if (orientation === "vertical") {
    return (
      <div
        aria-hidden="true"
        className={cn("h-full w-[2px]", className)}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 4px, ${color} 1.2px, transparent 1.6px)`,
          backgroundSize: "2px 8px",
          backgroundRepeat: "repeat-y",
        }}
      />
    );
  }
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={cn("w-full h-[8px]", className)}
      style={{
        backgroundImage: `radial-gradient(circle at 4px 4px, ${color} 1.4px, transparent 1.8px)`,
        backgroundSize: "8px 8px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
      }}
    />
  );
}