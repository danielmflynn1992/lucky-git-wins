import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function StaticPage({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="w-full flex-1 py-[var(--space-section)] px-4">
        <article className="on-light mx-auto max-w-3xl rounded-sm p-8 md:p-14 shadow-[var(--shadow-lift)]">
          {kicker && (
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-clover font-bold">
              {kicker}
            </div>
          )}
          <h1 className="mt-3 font-display">{title}</h1>
          <div className="prose prose-neutral mt-8 max-w-none text-foreground/85 [&_h2]:font-display [&_h2]:mt-10 [&_h2]:font-normal [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-3 [&_li]:mt-1">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}