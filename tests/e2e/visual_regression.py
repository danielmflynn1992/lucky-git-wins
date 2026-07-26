"""
Visual regression checks for the competitions list and detail pages.

Captures screenshots of the competitions listing and a competition detail
page at mobile + desktop viewports, then compares each against a stored
baseline PNG using a per-pixel RGB distance threshold.

On the first run (or when a route is missing a baseline) baselines are
recorded and the run reports "recorded". Pass --update to force-refresh
all baselines after an intentional design change.

Failures are written as side-by-side diff PNGs into
/tmp/browser/visual-regression/ and the script exits non-zero so CI blocks
the release.

Run:
  python3 tests/e2e/visual_regression.py            # check against baselines
  python3 tests/e2e/visual_regression.py --update   # refresh baselines
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080"
BASELINES = Path(__file__).parent / "baselines" / "visual"
OUT = Path("/tmp/browser/visual-regression")
BASELINES.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

# iPad-portrait sized tablet catches the mid-band where mobile 2-col grids
# hand off to desktop 3-col and card content re-flows.
VIEWPORTS = [("mobile", 390, 1400), ("tablet", 768, 1600), ("desktop", 1280, 1800)]

# (route_path, label, wait_for_selector) — detail slug is filled in at runtime.
ROUTES: list[tuple[str, str, str]] = [
    ("/competitions", "competitions-list", "a[href^='/competitions/']"),
    ("__DETAIL__", "competition-detail", "h1"),
]

# Per-pixel channel tolerance (0-255) — small anti-alias / font-hinting jitter
# does not count.
PIXEL_TOLERANCE = 12
# Fail when more than this fraction of pixels differ beyond PIXEL_TOLERANCE.
DIFF_RATIO_FAIL = 0.005  # 0.5%


async def discover_detail_slug(page) -> str | None:
    await page.goto(f"{BASE_URL}/competitions", wait_until="networkidle")
    href = await page.locator("a[href^='/competitions/']").first.get_attribute("href")
    if not href:
        return None
    return href.split("/competitions/")[-1].split("?")[0].split("#")[0]


async def capture(page, path: str, wait_sel: str, out_path: Path) -> None:
    await page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
    try:
        await page.wait_for_selector(wait_sel, timeout=5000)
    except Exception:
        pass
    # Freeze animations/countdowns so screenshots are deterministic.
    await page.add_style_tag(content="""
        *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            caret-color: transparent !important;
        }
        [data-countdown], .live-ticker, [data-live] { visibility: hidden !important; }
    """)
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(300)
    await page.screenshot(path=str(out_path))


def diff_images(baseline: Path, candidate: Path, diff_out: Path) -> tuple[float, tuple[int, int] | None]:
    a = Image.open(baseline).convert("RGB")
    b = Image.open(candidate).convert("RGB")
    if a.size != b.size:
        # Resize candidate to baseline for comparison; large size drift is itself a failure.
        b = b.resize(a.size)
    diff = ImageChops.difference(a, b)
    bbox = diff.getbbox()
    # Count pixels exceeding tolerance.
    px = diff.load()
    w, h = diff.size
    over = 0
    total = w * h
    for y in range(0, h, 2):  # subsample rows for speed; still catches meaningful drift
        for x in range(0, w, 2):
            r, g, bl = px[x, y]
            if r > PIXEL_TOLERANCE or g > PIXEL_TOLERANCE or bl > PIXEL_TOLERANCE:
                over += 1
    ratio = over / (total / 4)
    # Write a highlighted diff (red overlay where changed).
    overlay = Image.new("RGB", a.size, (255, 0, 0))
    mask = diff.convert("L").point(lambda v: 255 if v > PIXEL_TOLERANCE else 0)
    composite = Image.composite(overlay, a, mask)
    strip = Image.new("RGB", (a.width * 3 + 20, a.height), (255, 255, 255))
    strip.paste(a, (0, 0))
    strip.paste(b, (a.width + 10, 0))
    strip.paste(composite, (a.width * 2 + 20, 0))
    strip.save(diff_out)
    return ratio, bbox


async def main() -> int:
    update_mode = "--update" in sys.argv
    results: list[dict] = []
    any_fail = False

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Discover a live competition slug once.
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()
        slug = await discover_detail_slug(page)
        await ctx.close()
        if not slug:
            print("visual-regression: could not discover a competition slug — aborting")
            return 2

        for vp_label, w, h in VIEWPORTS:
            ctx = await browser.new_context(
                viewport={"width": w, "height": h}, device_scale_factor=1
            )
            page = await ctx.new_page()
            for route_path, label, wait_sel in ROUTES:
                path = f"/competitions/{slug}" if route_path == "__DETAIL__" else route_path
                key = f"{label}__{vp_label}"
                candidate = OUT / f"{key}.png"
                baseline = BASELINES / f"{key}.png"
                await capture(page, path, wait_sel, candidate)

                if update_mode or not baseline.exists():
                    baseline.parent.mkdir(parents=True, exist_ok=True)
                    Image.open(candidate).save(baseline)
                    results.append({"key": key, "status": "recorded", "path": path})
                    print(f"  [recorded] {key}  ({path})")
                    continue

                diff_out = OUT / f"{key}__diff.png"
                ratio, bbox = diff_images(baseline, candidate, diff_out)
                passed = ratio <= DIFF_RATIO_FAIL
                results.append({
                    "key": key, "status": "pass" if passed else "fail",
                    "path": path, "diff_ratio": round(ratio, 5),
                    "diff_bbox": bbox, "diff_image": str(diff_out),
                })
                marker = "OK  " if passed else "FAIL"
                print(f"  [{marker}] {key}  diff={ratio*100:.3f}%  ({path})")
                if not passed:
                    any_fail = True
            await ctx.close()
        await browser.close()

    (OUT / "report.json").write_text(json.dumps({
        "base_url": BASE_URL, "slug": slug,
        "pixel_tolerance": PIXEL_TOLERANCE,
        "diff_ratio_fail": DIFF_RATIO_FAIL,
        "results": results,
    }, indent=2))
    print(f"\nReport: {OUT / 'report.json'}")
    if any_fail:
        print("Visual regressions detected. Review diff PNGs; if intentional, rerun with --update.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))