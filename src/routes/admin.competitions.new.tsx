import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mock-comps";
import { ImagePlus, Zap, Copy, Save, ArrowLeft } from "lucide-react";

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
  const [instantWin, setInstantWin] = useState(false);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [autoDraw, setAutoDraw] = useState(true);
  const [status, setStatus] = useState<"Draft" | "Live" | "Paused">("Draft");

  return (
    <div className="min-h-screen flex flex-col bg-cream">
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
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-xl border-2 border-ink/10 bg-white px-3 py-2 text-sm font-bold">
              <option>Draft</option>
              <option>Live</option>
              <option>Paused</option>
            </select>
            <Button variant="cream" size="lg"><Copy className="h-4 w-4" /> Save as template</Button>
            <Button variant="gold" size="lg"><Save className="h-4 w-4" /> Publish</Button>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            <Card title="The prize">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Prize name" required className="sm:col-span-2" placeholder="e.g. Audi RS3 (or £45k cash)" />
                <SelectField label="Category">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </SelectField>
                <Field label="Short subtitle" className="sm:col-span-3" placeholder="One-liner shown on cards" />
                <TextArea label="Full description" className="sm:col-span-3" rows={4} placeholder="The story. Cheeky. Honest." />
              </div>
            </Card>

            <Card title="Images & video">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <button key={i} type="button" className="aspect-square rounded-xl border-2 border-dashed border-ink/20 bg-cream flex flex-col items-center justify-center gap-1 text-xs font-bold text-muted-foreground hover:border-clover hover:text-clover">
                    <ImagePlus className="h-6 w-6" />
                    {i === 0 ? "Cover" : `Photo ${i + 1}`}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Tickets & pricing">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Price per ticket (£)" type="number" step="0.01" required defaultValue="1.99" />
                <Field label="Total tickets" type="number" required defaultValue="5000" />
                <Field label="Max per person" type="number" defaultValue="150" />
                <Field label="Cash alternative (£)" type="number" required className="sm:col-span-1" defaultValue="1000" />
                <Field label="Closes at" type="datetime-local" required className="sm:col-span-2" />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={autoDraw} onChange={(e) => setAutoDraw(e.target.checked)} className="h-4 w-4 accent-clover" />
                Auto-draw when sold out or when timer hits zero (whichever first)
              </label>
            </Card>

            <Card title="Skill question">
              <Field label="Question" required placeholder="e.g. Which of these is a German car manufacturer?" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {answers.map((a, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${correct === i ? "border-clover bg-clover/5" : "border-ink/10 bg-white"}`}>
                    <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="h-4 w-4 accent-clover" />
                    <span className="text-xs font-black text-ink/60 w-4">{String.fromCharCode(65 + i)}</span>
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
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="# of instant wins" type="number" defaultValue="20" />
                  <Field label="Prize per win (£)" type="number" defaultValue="50" />
                  <SelectField label="Distribution"><option>Random</option><option>Specific numbers</option></SelectField>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card title="Preview">
              <div className="aspect-[4/3] rounded-xl bg-cream border-2 border-dashed border-ink/20 flex items-center justify-center text-xs font-bold text-muted-foreground">
                Live card preview
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Card updates as you type. Shown here at grid size.
              </div>
            </Card>
            <Card title="Compliance checklist">
              {["Skill question set", "Cash alternative filled", "Free-entry route (site-wide)", "Cover image", "Closing date"].map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm py-1">
                  <input type="checkbox" className="h-4 w-4 accent-clover" defaultChecked /> {c}
                </label>
              ))}
            </Card>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border-2 border-ink/5 p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
      <input {...props} className="mt-1 w-full h-11 rounded-xl border-2 border-ink/10 bg-cream px-3 font-semibold focus:outline-none focus:border-clover" />
    </label>
  );
}
function TextArea({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
      <textarea {...props} className="mt-1 w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2 font-semibold focus:outline-none focus:border-clover" />
    </label>
  );
}
function SelectField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
      <select className="mt-1 w-full h-11 rounded-xl border-2 border-ink/10 bg-cream px-3 font-semibold focus:outline-none focus:border-clover">{children}</select>
    </label>
  );
}