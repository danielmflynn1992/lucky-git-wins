import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DrawBoardForDraw } from "@/components/DrawBoard";

export const Route = createFileRoute("/draws/$id/board")({
  head: () => ({
    meta: [
      { title: "Watch the draw — Lucky Git Comps" },
      {
        name: "description",
        content:
          "Watch the official draw board replay the winning ticket, flap by flap, and check the result yourself.",
      },
      { property: "og:title", content: "Watch the draw — Lucky Git Comps" },
      {
        property: "og:description",
        content: "The official draw board: winning ticket revealed, and the proof underneath it.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoardPage,
  errorComponent: ({ error }) => (
    <Shell>
      <h1 className="font-display text-2xl font-black uppercase">Board unavailable</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <h1 className="font-display text-2xl font-black uppercase">No such draw</h1>
      <p className="mt-2 text-muted-foreground">
        <Link to="/results" className="underline">See every result</Link>.
      </p>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

function BoardPage() {
  const { id } = Route.useParams();
  return (
    <Shell>
      <div className="mb-4 text-xs font-semibold text-muted-foreground">
        <Link to="/results" className="hover:text-clover">Results</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">The Draw Board</span>
      </div>
      <DrawBoardForDraw drawId={id} />
    </Shell>
  );
}
