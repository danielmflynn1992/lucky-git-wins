import { useQuery } from "@tanstack/react-query";
import { fetchMyLimits } from "@/lib/account-api";
import { useAuth } from "@/hooks/use-auth";

/**
 * Cool-off / self-exclusion state for the signed-in account. UI-level only —
 * the database re-checks the same rules at purchase.
 */
export function usePlayBlock(): { blocked: boolean; message: string | null } {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-limits"],
    queryFn: fetchMyLimits,
    enabled: !!user,
    retry: false,
  });
  if (!data) return { blocked: false, message: null };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (data.self_excluded_until && new Date(data.self_excluded_until) > new Date()) {
    return {
      blocked: true,
      message: `You're self-excluded until ${fmt(data.self_excluded_until)}. Buying is off and we can't lift it early.`,
    };
  }
  if (data.cooloff_until && new Date(data.cooloff_until) > new Date()) {
    return {
      blocked: true,
      message: `You're on a break until ${fmt(data.cooloff_until)}. Have a look around, but buying's off until then.`,
    };
  }
  return { blocked: false, message: null };
}