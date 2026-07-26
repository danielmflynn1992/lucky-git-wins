"""
Visual regression check for CompCard.

Loads /dev/compcard in a headless browser and, for every rendered card,
asserts that both CTA buttons ("Enter Now" and "+ Add") fit inside their
column with no horizontal overflow. Also saves a screenshot of each
width bucket under /tmp/browser/compcard/ for eyeballing.

Run:  python3 tests/visual/compcard.py
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

URL = "http://localhost:8080/dev/compcard"
OUT = Path("/tmp/browser/compcard")
OUT.mkdir(parents=True, exist_ok=True)


async def main() -> int:
    failures: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        await page.goto(URL, wait_until="networkidle")

        sections = await page.query_selector_all("section[data-vr-width]")
        if not sections:
            print("No showcase sections rendered — is /dev/compcard reachable?")
            return 1

        for section in sections:
            width = await section.get_attribute("data-vr-width")
            await section.screenshot(path=str(OUT / f"width-{width}.png"))
            cards = await section.query_selector_all("[data-vr-card]")
            for card in cards:
                slug = await card.get_attribute("data-vr-card")
                # Every clickable/link CTA inside the card footer.
                ctas = await card.query_selector_all("a, button")
                for cta in ctas:
                    label = (await cta.inner_text()).strip().replace("\n", " ")
                    if not label:
                        continue
                    metrics = await cta.evaluate(
                        "el => ({ sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight })"
                    )
                    # Allow 1px of sub-pixel slack.
                    if metrics["sw"] > metrics["cw"] + 1:
                        failures.append(
                            f"[width={width} card={slug}] '{label}' overflows: "
                            f"scrollWidth={metrics['sw']} > clientWidth={metrics['cw']}"
                        )
                    if metrics["sh"] > metrics["ch"] + 1:
                        failures.append(
                            f"[width={width} card={slug}] '{label}' vertical overflow: "
                            f"scrollHeight={metrics['sh']} > clientHeight={metrics['ch']}"
                        )

        await browser.close()

    if failures:
        print("CompCard visual regression FAILED:")
        for f in failures:
            print("  -", f)
        print(f"\nScreenshots: {OUT}")
        return 1

    print(f"CompCard visual regression PASSED. Screenshots: {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))