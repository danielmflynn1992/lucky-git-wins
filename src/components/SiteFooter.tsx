import { Link } from "@tanstack/react-router";
import { Lockup } from "./Logo";
import { useSiteStats } from "@/lib/site-stats";
import { COMPANY_LINE, COMPANY_NAME, COMPANY_NUMBER, HAS_REAL_COMPANY_DETAILS } from "@/lib/company";

export function SiteFooter() {
  const { gitsMadeLucky } = useSiteStats();
  return (
    <footer className="relative mt-8 md:mt-12">
      {/* -------- TRUST BAR — on every page, above everything else -------- */}
      <TrustBar />

      {/* -------- INK-BLUE LINK GRID -------- */}
      <div
        style={{
          background: "var(--color-ink-blue)",
          color: "var(--color-on-dark-fg)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 md:pt-8 md:pb-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div
              className="flex"
              style={{ color: "var(--color-on-dark-fg)" }}
            >
              <Lockup style={{ maxWidth: 260, width: "100%", height: "auto" }} />
            </div>
            <p
              className="mt-4 text-sm max-w-xs leading-relaxed"
              style={{ color: "var(--color-on-dark-fg)" }}
            >
              The odds, out in the open. A UK prize competition platform built on automated, verifiable draws and a public results log.
            </p>
          </div>
          <FooterCol
            heading="Play"
            links={[
              { to: "/competitions", label: "Competitions" },
              { to: "/winners", label: "Winners" },
              { to: "/verify", label: "Verify" },
            ]}
          />
          <FooterCol
            heading="Legit"
            links={[
              { to: "/terms", label: "Terms & Conditions" },
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/responsible-play", label: "Responsible Play" },
              { to: "/guarantee", label: "Our Guarantee" },
              { to: "/how-entry-works", label: "How entry works" },
              { to: "/faq", label: "FAQ" },
            ]}
          />
          <div>
            <FooterCol
              heading="Us"
              links={[
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact & Support" },
              ]}
            />
            <p
              className="mt-6 text-xs leading-relaxed"
              style={{ color: "var(--color-on-dark-fg)" }}
            >
              <span
                className="inline-flex items-center gap-1 font-bold"
                style={{ color: "var(--color-marker)" }}
              >
                <span
                  aria-label="18 plus"
                  className="inline-flex items-center justify-center min-w-8 h-7 px-1.5 border-2 border-current text-xs font-black leading-none"
                >
                  18+
                </span>
                UK only. Please play responsibly.
              </span>
            </p>
          </div>
        </div>
        <div
          className="py-4 text-center text-[11px] font-mono tracking-wider"
          style={{
            borderTop: "1px solid color-mix(in oklab, var(--color-on-dark-fg) 22%, transparent)",
            color: "var(--color-on-dark-fg)",
          }}
        >
          <div className="mx-auto max-w-4xl px-4 pb-3 text-[10px] leading-relaxed opacity-90 [overflow-wrap:anywhere]">
            {COMPANY_LINE} ·{" "}
            <Link to="/terms" className="underline underline-offset-2">Terms</Link> ·{" "}
            <Link to="/privacy" className="underline underline-offset-2">Privacy</Link>
          </div>
          © {new Date().getFullYear()} LUCKYGITCOMPS
          {gitsMadeLucky > 0 && (
            <>
              <span className="mx-2 opacity-40">·</span>
              GITS MADE LUCKY SO FAR: <b className="tabular-nums">{gitsMadeLucky.toString().padStart(3, "0")}</b>
            </>
          )}
          <div className="mt-1.5 text-[10px] tracking-[0.18em] uppercase opacity-70">
            Built in Britain. Fuelled by tea and other people's luck.
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Persistent trust strip. Statutory bits, the age gate, the no-extension
 * promise and the help lines — visible on every page without a click.
 */
function TrustBar() {
  return (
    <div className="border-y-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-black)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-label="18 plus only"
            className="inline-flex h-5 min-w-8 items-center justify-center border-2 border-[var(--color-ink-red)] px-1 font-display text-[10px] leading-none text-[var(--color-ink-red)]"
          >
            18+
          </span>
          Only
        </span>
        <Sep />
        <Link to="/guarantee" className="underline underline-offset-2">Never extended, ever</Link>
        <Sep />
        <Link to="/how-entry-works" className="underline underline-offset-2">How entry works</Link>
        <Sep />
        <span className="normal-case tracking-normal">
          {HAS_REAL_COMPANY_DETAILS
            ? `${COMPANY_NAME} · Company No. ${COMPANY_NUMBER}`
            : `${COMPANY_NAME} · Registered in England & Wales`}
        </span>
        <Sep />
        <a
          href="https://www.gamcare.org.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          GamCare
        </a>
        <a
          href="https://www.begambleaware.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          BeGambleAware
        </a>
      </div>
    </div>
  );
}

function Sep() {
  return <span aria-hidden className="opacity-30">·</span>;
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { to: string; label: string; bold?: boolean }[];
}) {
  return (
    <div>
      <h4
        className="text-[11px] font-mono uppercase tracking-[0.22em] mb-4"
        style={{
          color: "var(--color-marker)",
          fontWeight: 700,
        }}
      >
        {heading}
      </h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="hover:underline underline-offset-4"
              style={{
                color: "var(--color-on-dark-fg)",
                fontWeight: l.bold ? 700 : 400,
              }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}