"""
Automated layout-overflow audit.

Loads each key route at mobile and desktop viewports and flags:
  - Horizontal page overflow (document scrollWidth > viewport width)
  - Elements that spill past the viewport's right edge
  - Clipped text (scrollWidth > clientWidth on elements with clip/hidden overflow,
    or truncate/line-clamp utilities where content is actually cut)
  - Broken images (natural size 0 or failed load) and hidden/zero-size <img> elements
  - Elements whose bounding box extends beyond their nearest positioned parent
    ("overhangs" — e.g. logos escaping the header bar)

Writes a JSON report and annotated screenshots to /tmp/browser/layout-audit/.
Exits non-zero when any hard failures are found so CI can fail the build.

Run:  python3 tests/e2e/layout_overflow.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from playwright.async_api import async_playwright, Page

BASE_URL = "http://localhost:8080"
OUT = Path("/tmp/browser/layout-audit")
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("mobile", 390, 844),
    ("desktop", 1280, 900),
]

# (path, label, wait_selector or None)
ROUTES: list[tuple[str, str, str | None]] = [
    ("/", "home", "a[href^='/competitions/']"),
    ("/competitions", "competitions", "a[href^='/competitions/']"),
    ("/how-it-works", "how-it-works", "h1"),
    ("/winners", "winners", "h1"),
    ("/past-draws", "past-draws", "h1"),
    ("/odds", "odds", "h1"),
    ("/free-entry", "free-entry", "h1"),
    ("/faq", "faq", "h1"),
    ("/checkout", "checkout", "h1"),
    ("/legal-structure", "legal-structure", "h1"),
    ("/promise", "promise", "h1"),
]


@dataclass
class RouteReport:
    route: str
    viewport: str
    url: str
    horizontal_overflow_px: int
    overflowing_elements: list[dict[str, Any]] = field(default_factory=list)
    clipped_text: list[dict[str, Any]] = field(default_factory=list)
    broken_images: list[dict[str, Any]] = field(default_factory=list)
    overhangs: list[dict[str, Any]] = field(default_factory=list)
    console_errors: list[str] = field(default_factory=list)
    screenshot: str | None = None

    @property
    def failures(self) -> int:
        return (
            (1 if self.horizontal_overflow_px > 0 else 0)
            + len(self.overflowing_elements)
            + len(self.clipped_text)
            + len(self.broken_images)
            + len(self.overhangs)
        )


# Runs inside the page. Returns a JSON-serializable dict of findings.
AUDIT_JS = r"""
() => {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  // Elements we don't care about (transient / offscreen by design).
  const isIgnorable = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') return true;
    // Tooltips, tickers, marquees etc. are allowed to move offscreen.
    if (el.closest('[data-marquee], [data-ticker], [role="tooltip"], .sr-only')) return true;
    // Fixed overlays used off-canvas by design
    if (s.position === 'fixed' && (el.getBoundingClientRect().width === 0)) return true;
    return false;
  };

  const describe = (el) => {
    const cls = (el.className && typeof el.className === 'string')
      ? el.className.trim().split(/\s+/).slice(0, 4).join('.')
      : '';
    const id = el.id ? `#${el.id}` : '';
    const text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}` + (text ? ` — "${text}"` : '');
  };

  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };

  const findings = {
    horizontal_overflow_px: Math.max(0, document.documentElement.scrollWidth - vw),
    overflowing_elements: [],
    clipped_text: [],
    broken_images: [],
    overhangs: [],
  };

  const all = Array.from(document.body.querySelectorAll('*'));
  for (const el of all) {
    if (isIgnorable(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      if (el.tagName === 'IMG') {
        const img = el;
        // Only report visible <img> tags that failed to render.
        const s = getComputedStyle(el);
        if (s.display !== 'none' && img.getAttribute('src')) {
          findings.broken_images.push({
            el: describe(el),
            src: img.currentSrc || img.src,
            reason: 'zero-size',
            rect: rectOf(el),
          });
        }
      }
      continue;
    }

    // Right-edge overflow past the viewport (allow 1px rounding).
    if (rect.right > vw + 1 && rect.left >= 0) {
      findings.overflowing_elements.push({
        el: describe(el),
        rect: rectOf(el),
        overflow_px: Math.round(rect.right - vw),
      });
    }

    // Broken <img>
    if (el.tagName === 'IMG') {
      const img = el;
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
        findings.broken_images.push({
          el: describe(el),
          src: img.currentSrc || img.src,
          reason: 'natural-width-0',
          rect: rectOf(el),
        });
      }
    }

    // Clipped text: content overflows its box and overflow hides it.
    const style = getComputedStyle(el);
    const overflowX = style.overflowX;
    const overflowY = style.overflowY;
    const clipsX = overflowX === 'hidden' || overflowX === 'clip';
    const clipsY = overflowY === 'hidden' || overflowY === 'clip';
    const hasTruncate = el.classList.contains('truncate')
      || /line-clamp-\d+/.test(el.className || '')
      || style.webkitLineClamp !== 'none';

    // Only care about elements that actually hold visible text of their own.
    const hasOwnText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent && n.textContent.trim().length > 0,
    );
    if (!hasOwnText) continue;

    const overX = el.scrollWidth - el.clientWidth;
    const overY = el.scrollHeight - el.clientHeight;

    // Horizontal text clipping when overflow-x hides content (excluding intentional
    // horizontal scroll containers like tables under overflow-auto).
    if (clipsX && overX > 2 && !hasTruncate) {
      findings.clipped_text.push({
        el: describe(el),
        overflow_x_px: overX,
        rect: rectOf(el),
        reason: 'overflow-x hidden with wider content',
      });
    }
    // Truncated single-line text that's actually cut (has ellipsis condition).
    if (hasTruncate && overX > 2) {
      findings.clipped_text.push({
        el: describe(el),
        overflow_x_px: overX,
        rect: rectOf(el),
        reason: 'truncate / line-clamp cutting content',
      });
    }
    // Vertical clipping when overflow-y hides real content (ignore small rounding).
    if (clipsY && overY > 4 && !hasTruncate && rect.height < 400) {
      findings.clipped_text.push({
        el: describe(el),
        overflow_y_px: overY,
        rect: rectOf(el),
        reason: 'overflow-y hidden with taller content',
      });
    }
  }

  // Overhangs: elements whose bounding box escapes their nearest positioned
  // ancestor's box by more than 12px on any side. Intentional overhangs mark
  // themselves with data-allow-overhang.
  for (const el of all) {
    if (isIgnorable(el)) continue;
    if (el.hasAttribute('data-allow-overhang')) continue;
    const parent = el.parentElement;
    if (!parent) continue;
    const ps = getComputedStyle(parent);
    if (!(ps.position === 'relative' || ps.position === 'absolute' || ps.position === 'fixed' || ps.position === 'sticky')) continue;
    // Skip if the child itself is absolutely positioned deliberately outside
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') continue;
    if (ps.overflow === 'hidden' || ps.overflowX === 'hidden' || ps.overflowY === 'hidden') continue;

    const cr = el.getBoundingClientRect();
    const pr = parent.getBoundingClientRect();
    const dx = Math.max(0, pr.left - cr.left, cr.right - pr.right);
    const dy = Math.max(0, pr.top - cr.top, cr.bottom - pr.bottom);
    if (dx > 12 || dy > 12) {
      // Only interesting when the child is also outside the viewport bounds,
      // or the parent is a nav/header/card container.
      const parentTag = parent.tagName.toLowerCase();
      if (['header', 'nav', 'article', 'section', 'aside', 'footer'].includes(parentTag)
          || /card|panel|plate|nav|header|footer/i.test(parent.className || '')) {
        findings.overhangs.push({
          el: describe(el),
          parent: describe(parent),
          dx: Math.round(dx),
          dy: Math.round(dy),
          rect: rectOf(el),
        });
      }
    }
  }

  return findings;
}
"""


async def audit_route(page: Page, path: str, label: str, wait_sel: str | None, viewport: str) -> RouteReport:
    console_errors: list[str] = []

    def on_console(msg):
        if msg.type == "error":
            console_errors.append(msg.text[:300])

    page.on("console", on_console)

    url = f"{BASE_URL}{path}"
    await page.goto(url, wait_until="networkidle", timeout=20_000)
    if wait_sel:
        try:
            await page.wait_for_selector(wait_sel, timeout=6_000)
        except Exception:
            pass
    # Let animations / images settle
    await page.wait_for_timeout(600)

    findings = await page.evaluate(AUDIT_JS)

    shot_path = OUT / f"{label}-{viewport}.png"
    try:
        await page.screenshot(path=str(shot_path))
    except Exception:
        shot_path = None

    return RouteReport(
        route=path,
        viewport=viewport,
        url=url,
        horizontal_overflow_px=findings["horizontal_overflow_px"],
        overflowing_elements=findings["overflowing_elements"][:20],
        clipped_text=findings["clipped_text"][:20],
        broken_images=findings["broken_images"][:20],
        overhangs=findings["overhangs"][:20],
        console_errors=console_errors[:10],
        screenshot=str(shot_path) if shot_path else None,
    )


async def main() -> int:
    reports: list[RouteReport] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for name, w, h in VIEWPORTS:
            context = await browser.new_context(viewport={"width": w, "height": h})
            page = await context.new_page()
            for path, label, sel in ROUTES:
                try:
                    rep = await audit_route(page, path, label, sel, name)
                    reports.append(rep)
                    tag = "OK" if rep.failures == 0 else f"FAIL x{rep.failures}"
                    print(f"[{name:7}] {path:24} {tag}")
                except Exception as e:
                    print(f"[{name:7}] {path:24} ERROR: {e}")
            await context.close()
        await browser.close()

    # Write JSON report
    payload = {
        "base_url": BASE_URL,
        "total_findings": sum(r.failures for r in reports),
        "routes": [
            {
                "route": r.route,
                "viewport": r.viewport,
                "url": r.url,
                "horizontal_overflow_px": r.horizontal_overflow_px,
                "overflowing_elements": r.overflowing_elements,
                "clipped_text": r.clipped_text,
                "broken_images": r.broken_images,
                "overhangs": r.overhangs,
                "console_errors": r.console_errors,
                "screenshot": r.screenshot,
            }
            for r in reports
        ],
    }
    report_path = OUT / "report.json"
    report_path.write_text(json.dumps(payload, indent=2))

    total = payload["total_findings"]
    print()
    print(f"Wrote report → {report_path}")
    print(f"Total findings: {total}")

    # Non-zero exit iff we saw a hard failure. Console errors alone are advisory.
    return 1 if total > 0 else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))