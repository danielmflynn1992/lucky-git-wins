import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function StaticPage({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16 w-full flex-1">
        {kicker && <div className="text-xs font-bold uppercase tracking-widest text-clover">{kicker}</div>}
        <h1 className="mt-1 font-display text-4xl md:text-5xl font-black">{title}</h1>
        <div className="prose prose-neutral mt-6 max-w-none text-foreground/85 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-black [&_h2]:mt-8 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-3 [&_li]:mt-1">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}