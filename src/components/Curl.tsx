/**
 * Curl — decorative swash flourish echoing the logo's script tail.
 */
export function Curl({
  className = "",
  width = 96,
  height = 20,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox="0 0 96 20"
      width={width}
      height={height}
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="curl-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8C6A1E" />
          <stop offset="50%" stopColor="#F0D783" />
          <stop offset="100%" stopColor="#8C6A1E" />
        </linearGradient>
      </defs>
      <path
        d="M2 10 C 14 2, 30 2, 48 10 S 82 18, 94 10 M 88 6 C 92 8, 92 12, 88 14"
        stroke="url(#curl-brass)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}