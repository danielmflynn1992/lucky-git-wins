import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES } from "@/lib/competitions-api";
import audi from "@/assets/prize-audi.jpg";
import tech from "@/assets/prize-tech.jpg";
import cash from "@/assets/prize-cash.jpg";
import holiday from "@/assets/prize-holiday.jpg";
import ps5 from "@/assets/prize-ps5.jpg";
import watch from "@/assets/prize-watch.jpg";

// Keyword → bundled asset. Used when a draw's competition has no image
// (older seed rows, deleted comps) so the Smug Gits wall never shows an
// empty typographic panel.
function placeholderForPrize(prize: string, title: string): string {
  const s = `${prize} ${title}`.toLowerCase();
  if (/(rolex|watch|submariner|omega|tag|timepiece)/.test(s)) return watch;
  if (/(audi|bmw|merc|porsche|car|motor|rs3|golf|m3)/.test(s)) return audi;
  if (/(ps5|xbox|playstation|console|iphone|macbook|ipad|apple|tech|gadget|airpods)/.test(s)) return tech;
  if (/(maldives|holiday|getaway|villa|trip|flight|dubai|ibiza)/.test(s)) return holiday;
  if (/(ps5)/.test(s)) return ps5;
  if (/(£|cash|readies|grand|k\b|pony|monkey)/.test(s)) return cash;
  return cash;
}

export type Winner = {
  id: string;
  competition_title: string;
  prize: string;
  winning_number: number;
  winner_display_name: string;
  winner_town: string;
  drawn_at: string;
  image: string | null;
  winner_photo_url: string | null;
  photo_consent: boolean;
  winner_quote: string | null;
  verification_hash: string;
  seed_revealed: string;
  qualifying_pool_size: number | null;
  /** True for seeded demo rows: no linked competition and no revealed seed. */
  isDemo: boolean;
};

export const winnersQuery = queryOptions({
  queryKey: ["winners"],
  queryFn: async (): Promise<Winner[]> => {
    const { data, error } = await supabase
      .from("draws")
      .select(
        "id, competition_id, competition_title, prize, winning_number, winner_display_name, winner_town, drawn_at, winner_photo_url, photo_consent, winner_quote, verification_hash, seed_revealed, qualifying_pool_size, competitions(slug, image)",
      )
      .order("drawn_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d: {
      id: string;
      competition_id: string | null;
      competition_title: string;
      prize: string;
      winning_number: number;
      winner_display_name: string;
      winner_town: string;
      drawn_at: string;
      winner_photo_url: string | null;
      photo_consent: boolean | null;
      winner_quote: string | null;
      verification_hash: string;
      seed_revealed: string;
      qualifying_pool_size: number | null;
      competitions: { slug: string; image: string } | null;
    }) => {
      const slug = d.competitions?.slug;
      const dbImage = d.competitions?.image;
      const image =
        (slug && IMAGES[slug]) ||
        (dbImage && /^https?:\/\//i.test(dbImage) ? dbImage : null) ||
        placeholderForPrize(d.prize ?? "", d.competition_title ?? "");
      return {
        id: d.id,
        competition_title: d.competition_title,
        prize: d.prize,
        winning_number: d.winning_number,
        winner_display_name: d.winner_display_name,
        winner_town: d.winner_town,
        drawn_at: d.drawn_at,
        image,
        winner_photo_url: d.winner_photo_url,
        photo_consent: !!d.photo_consent,
        winner_quote: d.winner_quote,
        verification_hash: d.verification_hash,
        seed_revealed: d.seed_revealed,
        qualifying_pool_size: d.qualifying_pool_size,
        isDemo: !d.competition_id && !d.seed_revealed,
      };
    });
  },
});

export function formatWinnerDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
