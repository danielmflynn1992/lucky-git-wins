import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function StaticPage({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="w-full flex-1 py-10 md:py-16 px-4">
        <article className="plain on-light paper mx-auto max-w-5xl rounded-sm p-6 md:p-12 shadow-[var(--shadow-lift)]">
          {kicker && (
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-clover font-bold">
              {kicker}
            </div>
          )}
          <h1 className="mt-2 font-display text-3xl md:text-5xl leading-[1.05]">{title}</h1>
          <div className="prose prose-neutral mt-6 max-w-none text-foreground/85 md:columns-2 md:gap-10 [&_h2]:font-display [&_h2]:mt-6 [&_h2]:mb-1 [&_h2]:font-normal [&_h2]:text-xl [&_h2]:break-after-avoid [&_p]:mt-2 [&_p]:break-inside-avoid [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:break-inside-avoid [&_li]:mt-1">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}