import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * One global subscription to ticket movement. Sold counters are the site's
 * headline honesty claim, so they update live rather than on refresh.
 */
export function useTicketsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("tickets-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        void qc.invalidateQueries({ queryKey: ["competitions"] });
        void qc.invalidateQueries({ queryKey: ["competition"] });
        void qc.invalidateQueries({ queryKey: ["live-odds"] });
        void qc.invalidateQueries({ queryKey: ["draw-board"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
