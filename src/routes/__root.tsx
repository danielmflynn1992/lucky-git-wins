import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { installClientErrorMonitor } from "../lib/client-error-monitor";
import { StampFilterDefs } from "@/components/StampMark";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">ERROR · 404</div>
        <h1 className="mt-3 font-display text-4xl font-semibold text-foreground">Nothing here, mate.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Whatever you were after has done a runner. Probably won something and cleared off to Marbella.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-clover text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-clover-deep"
          >
            Right, take me home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Right, well that didn't work.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something's fallen over on our end. Give it another go, or head home and pretend this never happened.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Give it another go
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lucky Git Comps — UK Prize Competitions" },
      { name: "description", content: "Cars, tech, cash and holidays up for grabs. Automatic random draws, verified winners. Go on then, you lucky git." },
      { name: "author", content: "Lucky Git Comps" },
      { property: "og:title", content: "Lucky Git Comps — UK Prize Competitions" },
      { property: "og:description", content: "Someone's got to win it. Chancers welcome." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/__l5e/assets-v1/c5dc15bf-f869-4882-91c8-8cced17155cf/luckygit-og.png" },
      { name: "twitter:image", content: "/__l5e/assets-v1/c5dc15bf-f869-4882-91c8-8cced17155cf/luckygit-og.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Alfa+Slab+One&family=Archivo:wght@400;500;600;700;800&family=Courier+Prime:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { installClientErrorMonitor(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StampFilterDefs />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
