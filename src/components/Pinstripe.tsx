/**
 * Pinstripe — brass hairline rule with a centered diamond,
 * borrowed from sign-writer / coachline tradition.
 * Use between homepage sections instead of blank space.
 */
export function Pinstripe({ className = "" }: { className?: string }) {
  return (
    <div role="separator" aria-hidden="true" className={`pinstripe-rule ${className}`} />
  );
}