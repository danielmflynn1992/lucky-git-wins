import { logClientErrors } from "./error-monitor.functions";

type Severity = "error" | "warning" | "info";
type Event = {
  severity: Severity;
  kind: string;
  message: string;
  stack?: string;
  route?: string;
  userAgent?: string;
  viewport?: string;
  extra?: Record<string, unknown>;
  fingerprint: string;
};

const queue: Event[] = [];
const seenFingerprints = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function fingerprint(kind: string, message: string, stack?: string) {
  const firstFrame = stack?.split("\n").find((l) => l.includes("://"))?.trim() ?? "";
  // Truncate message to keep dedup buckets useful
  return `${kind}::${message.slice(0, 160)}::${firstFrame.slice(0, 160)}`;
}

function ctx() {
  return {
    route: typeof location !== "undefined" ? location.pathname + location.search : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    viewport:
      typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
  };
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 1500);
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const events = queue.splice(0, queue.length);
  try {
    await logClientErrors({ data: { events } });
  } catch (e) {
    // Never let logging errors themselves throw
    if (typeof console !== "undefined") originalConsoleError.call(console, "[monitor] flush failed", e);
  }
}

let originalConsoleError: typeof console.error = console.error;

export function capture(
  kind: string,
  message: string,
  opts: { severity?: Severity; stack?: string; extra?: Record<string, unknown> } = {},
) {
  try {
    const severity = opts.severity ?? "error";
    const fp = fingerprint(kind, message, opts.stack);
    // Per-session dedup: still send the very first occurrence, then rely on
    // DB upsert to bump counts on later sessions. Prevents log storms.
    if (seenFingerprints.has(fp) && queue.some((e) => e.fingerprint === fp)) return;
    seenFingerprints.add(fp);
    const c = ctx();
    queue.push({
      severity,
      kind,
      message: String(message).slice(0, 2000),
      stack: opts.stack?.slice(0, 8000),
      extra: opts.extra,
      fingerprint: fp,
      ...c,
    });
    if (queue.length >= 5) flush();
    else scheduleFlush();
  } catch {
    /* never throw from monitor */
  }
}

function messageOf(v: unknown): string {
  if (v instanceof Error) return v.message;
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export function installClientErrorMonitor() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  originalConsoleError = console.error.bind(console);

  window.addEventListener("error", (e) => {
    // Broken image / script / link resources bubble here with e.target !== window
    const t = e.target as HTMLElement | null;
    if (t && t !== (window as unknown as HTMLElement) && "tagName" in t) {
      const tag = (t as HTMLElement).tagName;
      const src = (t as HTMLImageElement).currentSrc || (t as HTMLImageElement).src || (t as HTMLLinkElement).href;
      if (tag === "IMG" || tag === "SCRIPT" || tag === "LINK") {
        capture("resource_load", `${tag} failed to load: ${src || "unknown"}`, {
          severity: tag === "IMG" ? "warning" : "error",
          extra: { tag, src },
        });
        return;
      }
    }
    const err = (e as ErrorEvent).error;
    capture("runtime", messageOf(err ?? e.message), {
      severity: "error",
      stack: err instanceof Error ? err.stack : undefined,
      extra: { filename: e.filename, lineno: e.lineno, colno: e.colno },
    });
  }, true); // capture phase for resource errors

  window.addEventListener("unhandledrejection", (e) => {
    const r = (e as PromiseRejectionEvent).reason;
    capture("unhandledrejection", messageOf(r), {
      severity: "error",
      stack: r instanceof Error ? r.stack : undefined,
    });
  });

  // Wrap console.error but only forward genuine issues (skip our own logs).
  const wrapped = (...args: unknown[]) => {
    originalConsoleError(...args);
    try {
      const first = args[0];
      if (typeof first === "string" && first.startsWith("[monitor]")) return;
      const err = args.find((a) => a instanceof Error) as Error | undefined;
      const msg = err ? err.message : args.map(messageOf).join(" ").slice(0, 500);
      if (!msg) return;
      capture("console_error", msg, {
        severity: "warning",
        stack: err?.stack,
      });
    } catch {
      /* swallow */
    }
  };
  console.error = wrapped;

  // Flush before unload
  window.addEventListener("pagehide", () => { void flush(); });
}