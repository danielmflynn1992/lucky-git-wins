import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getIsAdmin } from "@/lib/admin.functions";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  // Session lives in localStorage, so the gate has to run client-side.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const isAdminFn = useServerFn(getIsAdmin);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "is-admin"],
    queryFn: () => isAdminFn({ data: undefined }),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNav />
        <main className="mx-auto max-w-xl px-4 py-20 flex-1 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-urgent" />
          <h1 className="mt-4 font-display text-3xl font-black">Not your stall, mate.</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            This area is for administrators only. Every admin action is checked again on the
            server, so there's nothing to be gained by poking at it.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="gold" size="lg"><Link to="/">Back to the stall</Link></Button>
            <Button asChild variant="cream" size="lg"><Link to="/account">My account</Link></Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <Outlet />;
}
