import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mock-comps";
import { ImagePlus, Copy, Save, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, HelpCircle } from "lucide-react";
import { createCompetition } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage, formatBytes, type OptimizeResult } from "@/lib/image-optimize";
import { LetterboxImage, type LetterboxStyle } from "@/components/LetterboxImage";
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
  const [totalTickets, setTotalTickets] = useState(499);
  const [maxPerPerson, setMaxPerPerson] = useState(150);
  const [cashAlternative, setCashAlternative] = useState(1000);
  const [endsAt, setEndsAt] = useState("");
  const [hot, setHot] = useState(false);
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"a" | "b" | "c" | "d">("a");
  const [status, setStatus] = useState<"draft" | "live" | "paused">("draft");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [letterboxStyle, setLetterboxStyle] = useState<LetterboxStyle>("blur");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [optimizeInfo, setOptimizeInfo] = useState<OptimizeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (totalTickets > 499) errs.push("Total tickets exceeds the 499 cap");
    if (question.trim().length < 8) errs.push("Skill question");
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) errs.push("All four options");
    return errs;
  }, [title, derivedSlug, endsAt, pricePerTicket, totalTickets, question, optionA, optionB, optionC, optionD]);

  async function handleFile(file: File) {
    setUploadError(null);
    setOptimizeInfo(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Pick an image file (jpg, png, webp).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("Image is too big. Keep it under 20 MB.");
      return;
    }
    setUploading(true);
    try {
      // Downscale + convert to WEBP client-side before upload so cards stay
      // fast without asking the admin to pre-process anything.
      const result = await optimizeImage(file, {
        maxEdge: 1600,
        targetBytes: 350 * 1024,
      });
      setOptimizeInfo(result);
      const ext = result.contentType === "image/webp" ? "webp" : result.contentType === "image/jpeg" ? "jpg" : (file.name.split(".").pop()?.toLowerCase() || "bin");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("competition-images")
        .upload(path, result.blob, { cacheControl: "31536000", upsert: false, contentType: result.contentType });
      if (upErr) throw upErr;
      // Bucket is private (workspace policy); use a very-long-lived signed URL.
      const { data: signed, error: sErr } = await supabase.storage
        .from("competition-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
      if (sErr) throw sErr;
      setImageUrl(signed.signedUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const mutation = useMutation({
    mutationFn: (publishAs: "draft" | "live" | "paused") =>
      createFn({
        data: {
          title: title.trim(),
          slug: derivedSlug,
          subtitle: subtitle.trim(),
          category,
          image: imageUrl,
          description: description.trim(),
          pricePerTicket: Number(pricePerTicket),
          totalTickets: Math.floor(Number(totalTickets)),
          cashAlternative: Math.floor(Number(cashAlternative)),
          maxPerPerson: Math.floor(Number(maxPerPerson)),
          endsAt,
          status: publishAs,
          hot,
          question: question.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correctOption,
          letterboxStyle,
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
          <div className="mt-4 rounded-xl border-2 border-urgent/40 bg-urgent/10 text-urgent p-3 text-sm flex items-start gap-2">
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

            <Card title="Cover image">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = "";
                }}
              />
              {imageUrl ? (
                <div className="space-y-3">
                  {/* Live card-frame preview honouring the chosen letterbox
                      style. The dashed outline marks the visible card area. */}
                  <div className="relative rounded-xl overflow-hidden border-2 border-border aspect-[5/4]">
                    <LetterboxImage
                      src={imageUrl}
                      alt="Cover preview"
                      style={letterboxStyle}
                      className="absolute inset-0 h-full w-full"
                      loading="eager"
                    />
                    <div className="pointer-events-none absolute inset-0" style={{ outline: "2px dashed rgb(15 107 63 / 0.7)", outlineOffset: "-6px" }} />
                    <span className="absolute top-2 left-2 rounded-md bg-ink/80 text-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Card frame · 5:4</span>
                    <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-ink/80 text-cream inline-flex items-center justify-center hover:bg-ink"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-2 right-2 rounded-full bg-cream text-ink px-3 py-1 text-xs font-bold shadow hover:bg-white"
                  >
                    Replace
                  </button>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Letterbox background</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["solid", "gradient", "blur"] as const).map((opt) => {
                        const active = letterboxStyle === opt;
                        const labels: Record<LetterboxStyle, string> = {
                          solid: "Solid",
                          gradient: "Gradient",
                          blur: "Blur",
                        };
                        const hints: Record<LetterboxStyle, string> = {
                          solid: "Flat neutral",
                          gradient: "Brand warmth",
                          blur: "Image echo",
                        };
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setLetterboxStyle(opt)}
                            aria-pressed={active}
                            className={`group relative rounded-lg overflow-hidden border-2 text-left transition-all ${active ? "border-clover ring-2 ring-clover/30" : "border-border hover:border-clover/60"}`}
                          >
                            <LetterboxImage
                              src={imageUrl}
                              alt=""
                              style={opt}
                              className="aspect-[5/4] w-full"
                              blur="md"
                              loading="eager"
                            />
                            <div className="px-2 py-1.5 bg-card">
                              <div className="text-[11px] font-bold">{labels[opt]}</div>
                              <div className="text-[10px] text-muted-foreground">{hints[opt]}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your full image sits inside the dashed 5:4 frame — nothing is cropped. The letterbox
                    background you pick above fills any empty space on cards and the detail page.
                    For edge-to-edge sharpness, upload a native <strong>5:4</strong> image (e.g. 1200×960).
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full aspect-[5/4] rounded-xl border-2 border-dashed border-border bg-background flex flex-col items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:border-clover hover:text-clover disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-7 w-7" />
                      Upload cover image
                      <span className="text-xs font-normal text-muted-foreground">JPG, PNG or WEBP · auto-optimized to WEBP</span>
                    </>
                  )}
                </button>
              )}
              {uploadError && (
                <div className="mt-3 text-xs text-urgent flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> <span>{uploadError}</span>
                </div>
              )}
              {optimizeInfo && !uploadError && (
                <div className="mt-3 rounded-lg border border-clover/30 bg-clover/5 p-3 text-[11px] leading-relaxed text-foreground/80">
                  <div className="font-bold text-clover uppercase tracking-wider text-[10px] mb-1">
                    {optimizeInfo.converted ? "Optimized before upload" : "Uploaded as-is"}
                  </div>
                  {optimizeInfo.converted ? (
                    <div className="font-mono tabular-nums">
                      {formatBytes(optimizeInfo.originalBytes)} → <strong>{formatBytes(optimizeInfo.optimizedBytes)}</strong>
                      {" "}({Math.max(0, Math.round((1 - optimizeInfo.optimizedBytes / optimizeInfo.originalBytes) * 100))}% smaller)
                      {" · "}{optimizeInfo.width}×{optimizeInfo.height}
                      {" · "}{optimizeInfo.contentType.replace("image/", "").toUpperCase()} q{Math.round(optimizeInfo.quality * 100)}
                    </div>
                  ) : (
                    <div>Source already smaller than the WEBP output — kept the original.</div>
                  )}
                </div>
              )}
            </Card>

            <Card title="Tickets & pricing">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Price per ticket (£)" type="number" step="0.01" required value={pricePerTicket} onChange={(e) => setPricePerTicket(Number(e.target.value))} />
                <div>
                  <Field
                    label="Total tickets (max 499)"
                    type="number"
                    min={1}
                    max={499}
                    required
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(Math.min(499, Math.max(1, Number(e.target.value) || 0)))}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Hard cap. We don't do five-figure ticket pools here.
                  </p>
                </div>
                <Field label="Max per person" type="number" value={maxPerPerson} onChange={(e) => setMaxPerPerson(Number(e.target.value))} />
                <Field label="Cash alternative (£)" type="number" required className="sm:col-span-1" value={cashAlternative} onChange={(e) => setCashAlternative(Number(e.target.value))} />
                <Field label="Closes at" type="datetime-local" required className="sm:col-span-2" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                All competitions auto-draw when the timer hits zero or the last ticket sells — no manual step.
              </p>
            </Card>

            <Card
              title={
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[color:var(--color-ink-red)]" />
                  Skill question <span className="text-xs font-normal text-[color:var(--color-ink-red)]">(required)</span>
                </span>
              }
            >
              <div className="rounded-md border-2 border-[color:var(--color-ink-red)] bg-[color:var(--color-ink-red)]/5 p-3 text-[11px] leading-relaxed text-foreground/80 mb-4">
                The answer must <strong>not</strong> be findable on this page or in the prize
                description. Questions must be difficult enough that a significant proportion of
                entrants answer incorrectly — this is the legal basis for the competition under
                Section 14 of the Gambling Act 2005.
              </div>
              <TextArea
                label="Question text"
                rows={2}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. In what year was the Ford GT40 first raced at Le Mans?"
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(["a", "b", "c", "d"] as const).map((k, i) => {
                  const val = [optionA, optionB, optionC, optionD][i];
                  const setters = [setOptionA, setOptionB, setOptionC, setOptionD];
                  return (
                    <div key={k} className="flex items-start gap-2">
                      <label className="flex items-center gap-1.5 mt-8 shrink-0 text-xs font-bold uppercase tracking-widest">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={correctOption === k}
                          onChange={() => setCorrectOption(k)}
                          className="h-4 w-4 accent-clover"
                          aria-label={`Mark option ${k.toUpperCase()} as correct`}
                        />
                        {k.toUpperCase()}
                      </label>
                      <Field
                        label={`Option ${k.toUpperCase()}${correctOption === k ? " · correct" : ""}`}
                        className="flex-1"
                        required
                        value={val}
                        onChange={(e) => setters[i](e.target.value)}
                        placeholder={correctOption === k ? "Correct answer (kept server-side)" : ""}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                The correct answer is written to the database only and never sent to the browser.
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card title="Live card preview">
              <div className="rounded-xl bg-background border-2 border-border p-4">
                {imageUrl ? (
                  <LetterboxImage
                    src={imageUrl}
                    alt=""
                    style={letterboxStyle}
                    className="w-full aspect-[5/4] rounded-lg mb-3"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full aspect-[5/4] rounded-lg bg-muted mb-3 flex items-center justify-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground">No image yet</div>
                )}
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
                { label: "Cover image uploaded", ok: !!imageUrl },
                { label: "Cash alternative filled", ok: cashAlternative > 0 },
                { label: "Closing date", ok: !!endsAt },
                { label: "Prize title", ok: title.trim().length >= 2 },
                { label: "Skill question set", ok: question.trim().length >= 8 && optionA.trim() && optionB.trim() && optionC.trim() && optionD.trim() ? true : false },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm py-1">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 text-clover" /> : <AlertTriangle className="h-4 w-4 text-urgent" />}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
              {validationErrors.length > 0 && (
                <p className="mt-3 text-xs text-urgent">Missing: {validationErrors.join(", ")}</p>
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
    <section className="rounded-2xl bg-card border-2 border-border p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input {...props} className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold focus:outline-none focus:border-clover" />
    </label>
  );
}
function TextArea({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <textarea {...props} className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none focus:border-clover" />
    </label>
  );
}
function SelectField({ label, children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <select {...props} className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold focus:outline-none focus:border-clover">{children}</select>
    </label>
  );
}