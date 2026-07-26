import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES } from "@/lib/competitions-api";

export type Winner = {
  id: string;
  competition_title: string;
  prize: string;
  winning_number: number;
  winner_display_name: string;
  winner_town: string;
  drawn_at: string;
  image: string | null;
};

export const winnersQuery = queryOptions({
  queryKey: ["winners"],
  queryFn: async (): Promise<Winner[]> => {
    const { data, error } = await supabase
      .from("draws")
      .select(
        "id, competition_id, competition_title, prize, winning_number, winner_display_name, winner_town, drawn_at, competitions(slug, image)",
      )
      .order("drawn_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d: {
      id: string;
      competition_title: string;
      prize: string;
      winning_number: number;
      winner_display_name: string;
      winner_town: string;
      drawn_at: string;
      competitions: { slug: string; image: string } | null;
    }) => {
      const slug = d.competitions?.slug;
      const dbImage = d.competitions?.image;
      const image =
        (slug && IMAGES[slug]) ||
        (dbImage && /^https?:\/\//i.test(dbImage) ? dbImage : null) ||
        null;
      return {
        id: d.id,
        competition_title: d.competition_title,
        prize: d.prize,
        winning_number: d.winning_number,
        winner_display_name: d.winner_display_name,
        winner_town: d.winner_town,
        drawn_at: d.drawn_at,
        image,
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
