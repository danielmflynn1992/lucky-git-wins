/**
 * Pinstripe — brass hairline rule with a centered diamond,
 * borrowed from sign-writer / coachline tradition.
 * Use between homepage sections instead of blank space.
 */
export function Pinstripe({ className = "" }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={`relative flex items-center justify-center py-6 ${className}`}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brass to-transparent opacity-70" />
      <span className="mx-3 inline-block h-2 w-2 rotate-45 bg-gradient-gold shadow-[inset_0_1px_0_rgba(255,255,255,.4),inset_0_-1px_0_rgba(0,0,0,.35)]" />
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brass to-transparent opacity-70" />
    </div>
  );
}