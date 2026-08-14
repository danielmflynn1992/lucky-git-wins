import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Retired page. The drop schedule it advertised existed nowhere else on the
 * site, so the route now permanently redirects to the live competitions list.
 */
export const Route = createFileRoute("/next-drop")({
  beforeLoad: () => {
    throw redirect({ to: "/competitions", statusCode: 301 });
  },
});
