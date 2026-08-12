import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { deleteMyAccount } from "@/lib/account.functions";
import {
  exportMyData,
  fetchMyLimits,
  selfExclude,
  setEmailPrefs,
  setMonthlyCap,
  startCooloff,
  type PlayerLimits,
} from "@/lib/account-api";

const CARD = "rounded-2xl bg-card border-2 border-border p-5";

function fmt(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
}

export function AccountSettings({ email }: { email: string | null }) {
  const qc = useQueryClient();
  const { data: limits } = useQuery<PlayerLimits>({
    queryKey: ["my-limits"],
    queryFn: fetchMyLimits,
    retry: false,
    enabled: !!email,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-limits"] });

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-black">The boring bits</h2>
      <div className="mt-4 space-y-4">
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Signed in as
            </div>
            <div className="font-semibold [overflow-wrap:anywhere]">{email ?? "Not signed in"}</div>
          </div>
          <Button variant="cream" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>

        <EmailPrefs limits={limits} onDone={refresh} disabled={!email} />
        <SpendCap limits={limits} onDone={refresh} disabled={!email} />
        <TakeABreak limits={limits} onDone={refresh} disabled={!email} />
        <SelfExclusion limits={limits} onDone={refresh} disabled={!email} />
        <DataAndDeletion disabled={!email} />

        <div className={`${CARD} text-sm`}>
          Worried about your spending? Read{" "}
          <Link to="/responsible-play" className="underline font-semibold">
            Responsible Play
          </Link>{" "}
          — free, confidential help is listed there.
        </div>
      </div>
    </section>
  );
}

function Row({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <div className="font-display text-lg font-bold">{title}</div>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmailPrefs({
  limits,
  onDone,
  disabled,
}: {
  limits?: PlayerLimits;
  onDone: () => void;
  disabled: boolean;
}) {
  const [drops, setDrops] = useState(true);
  const [results, setResults] = useState(true);
  useEffect(() => {
    if (limits) {
      setDrops(limits.email_drop_reminders);
      setResults(limits.email_draw_results);
    }
  }, [limits]);

  const save = useMutation({
    mutationFn: (v: { d: boolean; r: boolean }) => setEmailPrefs(v.d, v.r),
    onSuccess: () => {
      toast.success("Email preferences saved.");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Row title="Email preferences" sub="We'll only send what you tick.">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-clover"
            checked={drops}
            disabled={disabled}
            onChange={(e) => {
              setDrops(e.target.checked);
              save.mutate({ d: e.target.checked, r: results });
            }}
          />
          Drop reminders
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-clover"
            checked={results}
            disabled={disabled}
            onChange={(e) => {
              setResults(e.target.checked);
              save.mutate({ d: drops, r: e.target.checked });
            }}
          />
          Draw results
        </label>
      </div>
    </Row>
  );
}

function SpendCap({
  limits,
  onDone,
  disabled,
}: {
  limits?: PlayerLimits;
  onDone: () => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (limits?.monthly_cap_pence != null) setValue(String(Math.round(limits.monthly_cap_pence / 100)));
  }, [limits]);

  const save = useMutation({
    mutationFn: (pence: number | null) => setMonthlyCap(pence),
    onSuccess: (r) => {
      if (r.pending_cap_effective_at) {
        toast.success("Increase takes effect in 24 hours — 24h cooling-off applies.");
      } else {
        toast.success("Monthly limit updated.");
      }
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Row
      title="Monthly spend limit"
      sub="Lower it and it applies straight away. Raise it and it takes 24 hours — that's the point."
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="font-mono">£</span>
          <input
            inputMode="numeric"
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="No limit"
            className="h-11 w-32 rounded-xl border-2 border-border bg-background px-3 font-semibold tabular-nums focus:outline-none focus:border-clover"
          />
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
        <Button
          size="sm"
          disabled={disabled || save.isPending}
          onClick={() => save.mutate(value === "" ? null : Number(value) * 100)}
        >
          Save limit
        </Button>
        {limits?.monthly_cap_pence != null && (
          <Button
            size="sm"
            variant="cream"
            disabled={disabled || save.isPending}
            onClick={() => {
              setValue("");
              save.mutate(null);
            }}
          >
            Remove limit
          </Button>
        )}
      </div>
      {limits?.pending_cap_effective_at && (
        <p className="mt-2 text-sm text-[color:var(--color-ink-red)] font-semibold">
          Pending change{" "}
          {limits.pending_cap_pence == null
            ? "(remove limit)"
            : `to £${Math.round(limits.pending_cap_pence / 100)}`}{" "}
          applies {new Date(limits.pending_cap_effective_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}.
        </p>
      )}
    </Row>
  );
}

function TakeABreak({
  limits,
  onDone,
  disabled,
}: {
  limits?: PlayerLimits;
  onDone: () => void;
  disabled: boolean;
}) {
  const active = limits?.cooloff_until && new Date(limits.cooloff_until) > new Date();
  const save = useMutation({
    mutationFn: (days: 7 | 30 | 90) => startCooloff(days),
    onSuccess: () => {
      toast.success("Break started. Buying is off until it's up.");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Row
      title="Take a break"
      sub="Buying stops for the period you pick. It can't be lifted early — not by you, not by us."
    >
      {active ? (
        <div className="text-sm font-semibold">On a break until {fmt(limits?.cooloff_until)}.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {([7, 30, 90] as const).map((d) => (
            <Button
              key={d}
              size="sm"
              variant="cream"
              disabled={disabled || save.isPending}
              onClick={() => {
                if (confirm(`Stop buying for ${d === 7 ? "1 week" : d === 30 ? "1 month" : "3 months"}? This can't be undone early.`)) {
                  save.mutate(d);
                }
              }}
            >
              {d === 7 ? "1 week" : d === 30 ? "1 month" : "3 months"}
            </Button>
          ))}
        </div>
      )}
    </Row>
  );
}

function SelfExclusion({
  limits,
  onDone,
  disabled,
}: {
  limits?: PlayerLimits;
  onDone: () => void;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [months, setMonths] = useState(6);
  const active = limits?.self_excluded_until && new Date(limits.self_excluded_until) > new Date();
  const save = useMutation({
    mutationFn: () => selfExclude(months),
    onSuccess: () => {
      toast.success("Self-exclusion applied.");
      setConfirming(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (active) {
    return (
      <Row title="Self-exclusion">
        <div className="text-sm font-semibold">
          Self-excluded until {fmt(limits?.self_excluded_until)}. This cannot be reversed.
        </div>
      </Row>
    );
  }

  return (
    <Row title="Self-exclusion" sub="Six months minimum. Once it's on, it stays on.">
      {!confirming ? (
        <Button size="sm" variant="cream" disabled={disabled} onClick={() => setConfirming(true)}>
          Self-exclude
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-[color:var(--color-ink-red)] p-4 text-sm space-y-2">
            <p className="font-bold">Read this before you tap the button.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You will not be able to buy tickets for the whole period.</li>
              <li>We will not reverse it. Not on request, not for any reason.</li>
              <li>Marketing emails stop immediately.</li>
              <li>Tickets you already hold stay in their draws and pay out as normal if they win.</li>
            </ul>
          </div>
          <label className="flex items-center gap-2 text-sm">
            Period:
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="h-10 rounded-xl border-2 border-border bg-background px-3 font-semibold"
            >
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
              <option value={1200}>Permanent</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button size="sm" variant="cream" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
              I understand — self-exclude me
            </Button>
          </div>
        </div>
      )}
    </Row>
  );
}

function DataAndDeletion({ disabled }: { disabled: boolean }) {
  const [step, setStep] = useState(0);

  const download = useMutation({
    mutationFn: exportMyData,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lucky-git-comps-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteMyAccount({ data: undefined }),
    onSuccess: async () => {
      toast.success("Account deleted. All the best.");
      await supabase.auth.signOut();
      window.location.href = "/";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Row title="Your data" sub="Take it with you, or have the lot deleted.">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="cream" disabled={disabled || download.isPending} onClick={() => download.mutate()}>
          Download my data
        </Button>
        {step === 0 ? (
          <Button size="sm" variant="cream" disabled={disabled} onClick={() => setStep(1)}>
            Delete my account
          </Button>
        ) : (
          <Button size="sm" variant="cream" onClick={() => setStep(0)}>
            Keep my account
          </Button>
        )}
      </div>
      {step > 0 && (
        <div className="mt-3 rounded-xl border-2 border-[color:var(--color-ink-red)] p-4 text-sm space-y-3">
          <p>
            Deleting removes your account and personal details. Entries in competitions that are still
            open stay in those draws and are only forfeited after the draw has run — we can't pay a
            prize to an account that no longer exists.
          </p>
          {step === 1 ? (
            <Button size="sm" onClick={() => setStep(2)}>
              I understand — continue
            </Button>
          ) : (
            <Button size="sm" disabled={del.isPending} onClick={() => del.mutate()}>
              Delete my account permanently
            </Button>
          )}
        </div>
      )}
    </Row>
  );
}