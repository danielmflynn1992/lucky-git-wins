import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mock-comps";
import { ImagePlus, Zap, Copy, Save, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createCompetition } from "@/lib/admin.functions";
import type { ReactNode } from "react";

export const Route = createFileRoute("/admin/competitions/new")({
  head: () => ({
    meta: [
      { title: "New Competition — Lucky Git Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewComp,
});

function NewComp() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createCompetition);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0] ?? "Cars");
  const [description, setDescription] = useState("");
  const [pricePerTicket, setPricePerTicket] = useState(1.99);
  const [totalTickets, setTotalTickets] = useState(5000);
  const [maxPerPerson, setMaxPerPerson] = useState(150);
  const [cashAlternative, setCashAlternative] = useState(1000);
  const [endsAt, setEndsAt] = useState("");
  const [hot, setHot] = useState(false);
  const [skillQ, setSkillQ] = useState("");
  const [instantWin, setInstantWin] = useState(false);
  const [instantWinCount, setInstantWinCount] = useState(20);
  const [instantWinPrize, setInstantWinPrize] = useState(50);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [status, setStatus] = useState<"draft" | "live" | "paused">("draft");

  const derivedSlug = useMemo(() => {
    const src = (slug || title).toLowerCase().trim();
    return src.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }, [slug, title]);

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (title.trim().length < 2) errs.push("Prize name");
    if (!derivedSlug) errs.push("URL slug");
    if (!endsAt) errs.push("Closing date");
    if (pricePerTicket <= 0) errs.push("Ticket price");
    if (totalTickets < 1) errs.push("Total tickets");
    if (skillQ.trim().length < 3) errs.push("Skill question");
    if (answers.some((a) => !a.trim())) errs.push("Skill answers (all 4)");
    if (instantWin && instantWinCount > totalTickets) errs.push("Instant-win count exceeds total");
    return errs;
  }, [title, derivedSlug, endsAt, pricePerTicket, totalTickets, skillQ, answers, instantWin, instantWinCount]);

  const mutation = useMutation({
    mutationFn: (publishAs: "draft" | "live" | "paused") =>
      createFn({
        data: {
          title: title.trim(),
          slug: derivedSlug,
          subtitle: subtitle.trim(),
          category,
          image: "",
          description: description.trim(),
          pricePerTicket: Number(pricePerTicket),
          totalTickets: Math.floor(Number(totalTickets)),
          cashAlternative: Math.floor(Number(cashAlternative)),
          maxPerPerson: Math.floor(Number(maxPerPerson)),
          endsAt,
          status: publishAs,
          hot,
          skillQuestion: {
            q: skillQ.trim(),
            options: answers.map((a) => a.trim()),
            correct,
          },
          instantWin,
          instantWinCount: Math.floor(Number(instantWinCount) || 0),
          instantWinPrize: Number(instantWinPrize) || 0,
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["competition"] });
      navigate({ to: "/competitions/$slug", params: { slug: res.slug } });
    },
  });

  const submit = (publishAs: "draft" | "live" | "paused") => {
    if (validationErrors.length) return;
    setStatus(publishAs);
    mutation.mutate(publishAs);
  };

  const isSubmitting = mutation.isPending;
  const errorMessage = mutation.error instanceof Error ? mutation.error.message : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 py-6 w-full flex-1">
        {/* Admin header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link to="/admin" className="text-xs font-bold text-muted-foreground inline-flex items-center gap-1 hover:text-clover">
              <ArrowLeft className="h-3 w-3" /> Back to admin
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-black mt-1">New Competition</h1>
            <p className="text-muted-foreground text-sm">Under two minutes. Bosh.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="cream"
              size="lg"
              disabled={isSubmitting || !!validationErrors.length}
              onClick={() => submit("draft")}
            >
              {isSubmitting && status === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Save draft
            </Button>
            <Button
              type="button"
              variant="gold"
              size="lg"
              disabled={isSubmitting || !!validationErrors.length}
              onClick={() => submit("live")}
            >
              {isSubmitting && status === "live" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Publish live
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border-2 border-hot/40 bg-hot/10 text-hot p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>Couldn't save: {errorMessage}</div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submit("live"); }} className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            <Card title="The prize">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Prize name" required className="sm:col-span-2" placeholder="e.g. Audi RS3 (or £45k cash)" value={title} onChange={(e) => setTitle(e.target.value)} />
                <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </SelectField>
                <Field label="URL slug" className="sm:col-span-3" placeholder="auto-generated from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <Field label="Short subtitle" className="sm:col-span-3" placeholder="One-liner shown on cards" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                <TextArea label="Full description" className="sm:col-span-3" rows={4} placeholder="The story. Cheeky. Honest." value={description} onChange={(e) => setDescription(e.target.value)} />
                <label className="sm:col-span-3 flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={hot} onChange={(e) => setHot(e.target.checked)} className="h-4 w-4 accent-clover" />
                  Feature as "Hot" on the homepage
                </label>
              </div>
            </Card>

            <Card title="Images & video">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <button key={i} type="button" className="aspect-square rounded-xl border-2 border-dashed border-white/20 bg-background flex flex-col items-center justify-center gap-1 text-xs font-bold text-muted-foreground hover:border-clover hover:text-clover">
                    <ImagePlus className="h-6 w-6" />
                    {i === 0 ? "Cover" : `Photo ${i + 1}`}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Tickets & pricing">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Price per ticket (£)" type="number" step="0.01" required value={pricePerTicket} onChange={(e) => setPricePerTicket(Number(e.target.value))} />
                <Field label="Total tickets" type="number" required value={totalTickets} onChange={(e) => setTotalTickets(Number(e.target.value))} />
                <Field label="Max per person" type="number" value={maxPerPerson} onChange={(e) => setMaxPerPerson(Number(e.target.value))} />
                <Field label="Cash alternative (£)" type="number" required className="sm:col-span-1" value={cashAlternative} onChange={(e) => setCashAlternative(Number(e.target.value))} />
                <Field label="Closes at" type="datetime-local" required className="sm:col-span-2" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                All competitions auto-draw when the timer hits zero or the last ticket sells — no manual step.
              </p>
            </Card>

            <Card title="Skill question">
              <Field label="Question" required placeholder="e.g. Which of these is a German car manufacturer?" value={skillQ} onChange={(e) => setSkillQ(e.target.value)} />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {answers.map((a, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${correct === i ? "border-clover bg-clover/5" : "border-white/10 bg-card"}`}>
                    <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="h-4 w-4 accent-clover" />
                    <span className="text-xs font-black text-foreground/60 w-4">{String.fromCharCode(65 + i)}</span>
                    <input
                      value={a}
                      onChange={(e) => { const n = [...answers]; n[i] = e.target.value; setAnswers(n); }}
                      placeholder={`Answer ${i + 1}`}
                      className="flex-1 bg-transparent focus:outline-none font-semibold"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Tick the correct answer. Keep it genuinely answerable — required by UK law.</p>
            </Card>

            <Card title={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-gold" /> Instant wins <span className="text-xs font-normal text-muted-foreground">(optional)</span></span>}>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={instantWin} onChange={(e) => setInstantWin(e.target.checked)} className="h-4 w-4 accent-clover" />
                Enable instant win tickets on this comp
              </label>
              {instantWin && (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="# of instant wins" type="number" value={instantWinCount} onChange={(e) => setInstantWinCount(Number(e.target.value))} />
                    <Field label="Prize per win (£)" type="number" value={instantWinPrize} onChange={(e) => setInstantWinPrize(Number(e.target.value))} />
                    <SelectField label="Distribution"><option>Random</option></SelectField>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {instantWinCount} random ticket numbers out of {totalTickets.toLocaleString()} will be flagged as instant winners at £{instantWinPrize} each.
                  </p>
                </>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card title="Preview">
              <div className="rounded-xl bg-background border-2 border-white/10 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-clover/80">{category}</div>
                <div className="font-display font-black text-lg leading-tight mt-1 truncate">{title || "Prize title"}</div>
                <div className="text-xs text-muted-foreground truncate">{subtitle || "Short subtitle"}</div>
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="tabular-nums">£{pricePerTicket.toFixed(2)}/ticket</span>
                  <span className="tabular-nums">{totalTickets.toLocaleString()} tix</span>
                </div>
                <div className="mt-1 text-[10px] font-mono text-muted-foreground">/{derivedSlug || "url-slug"}</div>
              </div>
            </Card>
            <Card title="Compliance checklist">
              {[
                { label: "Skill question set", ok: skillQ.trim().length >= 3 && answers.every((a) => a.trim().length > 0) },
                { label: "Cash alternative filled", ok: cashAlternative > 0 },
                { label: "Closing date", ok: !!endsAt },
                { label: "Prize title", ok: title.trim().length >= 2 },
                { label: "Free-entry route (site-wide)", ok: true },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm py-1">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 text-clover" /> : <AlertTriangle className="h-4 w-4 text-hot" />}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
              {validationErrors.length > 0 && (
                <p className="mt-3 text-xs text-hot">Missing: {validationErrors.join(", ")}</p>
              )}
            </Card>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card border-2 border-white/5 p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">{label}</span>
      <input {...props} className="mt-1 w-full h-11 rounded-xl border-2 border-white/10 bg-background px-3 font-semibold focus:outline-none focus:border-clover" />
    </label>
  );
}
function TextArea({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">{label}</span>
      <textarea {...props} className="mt-1 w-full rounded-xl border-2 border-white/10 bg-background px-3 py-2 font-semibold focus:outline-none focus:border-clover" />
    </label>
  );
}
function SelectField({ label, children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">{label}</span>
      <select {...props} className="mt-1 w-full h-11 rounded-xl border-2 border-white/10 bg-background px-3 font-semibold focus:outline-none focus:border-clover">{children}</select>
    </label>
  );
}