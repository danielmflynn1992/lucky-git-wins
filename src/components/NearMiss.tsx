import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getNearMiss } from "@/lib/near-miss.functions";

/** Copy is fixed by distance band. No "try again" — this is a moment, not a funnel. */
export function nearMissLine(winning: number, closest: number, distance: number): string {
  if (distance === 1) return `Winning ticket: ${winning}. You had ${closest}. One off. We're so sorry. Genuinely.`;
  if (distance <= 5) return `Winning ticket: ${winning}. Your closest was ${closest}. Painfully close.`;
  if (distance <= 25) return `Winning ticket: ${winning}. You were in the neighbourhood. Wrong house, but the neighbourhood.`;
  return `Winning ticket: ${winning}. Yours were… elsewhere. Better luck next drop.`;
}

/**
 * Personalised near-miss readout. Only rendered for signed-in entrants of a
 * competition that has already been drawn — never as pre-draw tension, never
 * for people who didn't enter.
 */
export function NearMiss({ slug, competitionTitle }: { slug: string; competitionTitle: string }) {
  const { session } = useAuth();
  const fetchNearMiss = useServerFn(getNearMiss);
  const { data } = useQuery({
    queryKey: ["near-miss", slug, session?.user.id ?? "anon"],
    queryFn: () => fetchNearMiss({ data: { slug } }),
    enabled: Boolean(session),
    staleTime: 5 * 60_000,
  });

  if (!data || !data.drawn || !data.entered || data.won) return null;
  const { winningNumber: n, closest: m, distance } = data;
  if (n === null || m === null || distance === null) return null;

  return (
    <section className="mt-6 border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <div className="bg-[var(--color-ink-blue)] px-3 py-1.5 font-body font-bold uppercase tracking-[0.16em] text-[9px] text-[var(--color-paper)]">
        Your entry · result
      </div>
      <div className="p-4">
        <p className="font-display uppercase tracking-[0.02em] text-lg leading-tight">
          Not this time. Your numbers were rubbish, but they were YOUR rubbish numbers.
        </p>
        <p className="mt-2 font-mono text-sm text-[var(--color-ink-black)]">{nearMissLine(n, m, distance)}</p>
        <p className="mt-2 font-mono text-[11px] text-[var(--color-ink-grey)]">
          Your numbers: {data.yourNumbers.join(", ")}
        </p>
        {distance <= 5 && (
          <ShareNearMiss winning={n} yours={m} title={competitionTitle} />
        )}
      </div>
    </section>
  );
}

/** Draws a share card on a canvas and hands it to the native share sheet
 *  (or a download when sharing files isn't supported). */
function ShareNearMiss({ winning, yours, title }: { winning: number; yours: number; title: string }) {
  const onShare = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#F4EFE2";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.strokeStyle = "#11100E";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, 1152, 582);

    ctx.fillStyle = "#C8102E";
    ctx.fillRect(24, 24, 1152, 76);
    ctx.fillStyle = "#F4EFE2";
    ctx.font = "bold 30px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("LUCKY GIT COMPS · NEAR MISS", 600, 74);

    ctx.fillStyle = "#11100E";
    ctx.font = "bold 150px 'Courier New', monospace";
    ctx.fillText(String(winning), 380, 320);
    ctx.fillText(String(yours), 820, 320);
    ctx.font = "26px 'Courier New', monospace";
    ctx.fillText("WINNING TICKET", 380, 370);
    ctx.fillText("MINE", 820, 370);

    ctx.fillStyle = "#C8102E";
    ctx.font = "bold 44px 'Courier New', monospace";
    ctx.fillText(`GAP: ${Math.abs(winning - yours)}`, 600, 320);

    ctx.fillStyle = "#11100E";
    ctx.font = "bold 84px 'Courier New', monospace";
    ctx.fillText("THIS CLOSE.", 600, 500);
    ctx.font = "24px 'Courier New', monospace";
    ctx.fillText(title.toUpperCase(), 600, 556);

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "this-close.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "THIS CLOSE." });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "this-close.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="mt-4 inline-flex items-center gap-2 border-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-xs hover:bg-[var(--color-ink-yellow)]"
    >
      <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
      Share your near miss
    </button>
  );
}