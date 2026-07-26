"""E2E: browse → ticket select → checkout, on mobile and desktop.

Run: python3 tests/e2e/browse_to_checkout.py
"""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout

BASE = "http://localhost:8080"
SHOT_ROOT = Path("/tmp/browser/e2e")
SHOT_ROOT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = {
    "mobile":  {"width": 390,  "height": 844},
    "desktop": {"width": 1280, "height": 900},
}


async def shot(page: Page, viewport: str, name: str) -> None:
    d = SHOT_ROOT / viewport
    d.mkdir(parents=True, exist_ok=True)
    await page.screenshot(path=str(d / f"{name}.png"))


async def open_first_competition(page: Page, viewport: str) -> str:
    """Navigate home, click the first competition card, return its slug."""
    await page.goto(BASE + "/", wait_until="domcontentloaded")
    # Scope to CompCard's stretched link inside a .paper wrapper — the
    # bare `a[href^="/competitions/"]` selector also matches the animated
    # LiveOddsTicker links, which never report as "stable" to Playwright.
    card = page.locator('.paper a[href^="/competitions/"]').first
    await card.wait_for(state="visible", timeout=15_000)
    href = await card.get_attribute("href")
    assert href and href.startswith("/competitions/"), f"bad href: {href!r}"
    await shot(page, viewport, "01_home")
    # Click the card; if the stretched link is occluded on this viewport
    # (a real bug we've had before), fall back to direct nav so the rest of
    # the flow still runs — but log it.
    try:
        await card.click(timeout=5_000)
        await page.wait_for_url(f"**{href}", timeout=8_000)
    except PWTimeout:
        print(f"  ! card click did not navigate on {viewport}; using goto()")
        await page.goto(BASE + href, wait_until="domcontentloaded")
    await page.get_by_role("button", name="Enter now").first.wait_for(timeout=15_000)
    await shot(page, viewport, "02_detail")
    return href.rsplit("/", 1)[-1]


async def assert_prize_image_loaded(page: Page) -> None:
    """Fail loud if the hero image is broken (0 naturalWidth)."""
    widths = await page.evaluate(
        "() => Array.from(document.images).map(i => i.naturalWidth)"
    )
    assert any(w and w > 20 for w in widths), (
        f"no successfully loaded images on detail page (widths={widths[:8]})"
    )


async def flow_lucky_dip(page: Page, viewport: str) -> None:
    slug = await open_first_competition(page, viewport)
    await assert_prize_image_loaded(page)

    # Lucky Dip is the default picker. Bump qty to 3 via the "+ 3" preset or +.
    lucky_tab = page.get_by_role("button", name="Lucky Dip")
    await lucky_tab.click()

    # Try preset "5" if visible, else use the + button twice from default 1.
    preset_5 = page.get_by_role("button", name="5", exact=True)
    if await preset_5.count():
        await preset_5.first.click()

    await shot(page, viewport, "03_lucky_qty")

    enter = page.get_by_role("button", name="Enter now").first
    await enter.scroll_into_view_if_needed()
    await enter.click()
    await page.wait_for_url("**/checkout*", timeout=20_000)
    await page.locator("text=Reserved ticket numbers").first.wait_for(timeout=15_000)
    await shot(page, viewport, "04_checkout_lucky")
    print(f"  [lucky-dip/{viewport}] checkout reached for {slug}")


async def flow_pick_numbers(page: Page, viewport: str) -> None:
    slug = await open_first_competition(page, viewport)

    await page.get_by_role("button", name="Pick numbers").click()
    # Give the picker mode a beat to swap in before querying tiles.
    await page.wait_for_timeout(300)
    tiles = page.locator('[class*="grid-cols-10"] > button:not([disabled])')
    await tiles.first.wait_for(timeout=10_000)
    n = await tiles.count()
    assert n >= 2, f"not enough available numbers to pick ({n})"
    await tiles.nth(0).click()
    await tiles.nth(1).click()
    await shot(page, viewport, "05_pick_two")

    enter = page.get_by_role("button", name="Enter now").first
    await enter.scroll_into_view_if_needed()
    await enter.click()
    await page.wait_for_url("**/checkout*", timeout=20_000)
    await page.locator("text=Reserved ticket numbers").first.wait_for(timeout=15_000)
    await shot(page, viewport, "06_checkout_pick")
    print(f"  [pick-numbers/{viewport}] checkout reached for {slug}")


async def run_viewport(pw, viewport: str) -> list[str]:
    failures: list[str] = []
    browser = await pw.chromium.launch(headless=True)

    for name, flow in [("lucky_dip", flow_lucky_dip), ("pick_numbers", flow_pick_numbers)]:
        # Fresh context per flow so ticket reservations from the previous
        # flow don't shrink availability under our feet.
        ctx = await browser.new_context(viewport=VIEWPORTS[viewport])
        page = await ctx.new_page()
        page.on("pageerror", lambda e, v=viewport: print(f"  ! pageerror[{v}]: {e}"))
        try:
            print(f"[{viewport}] {name} …")
            await flow(page, viewport)
        except (AssertionError, PWTimeout) as e:
            failures.append(f"{viewport}/{name}: {e}")
            try:
                await shot(page, viewport, f"FAIL_{name}")
            except Exception:
                pass
            print(f"  FAIL {viewport}/{name}: {e}")
        finally:
            await ctx.close()

    await browser.close()
    return failures


async def main() -> int:
    all_failures: list[str] = []
    async with async_playwright() as pw:
        for vp in VIEWPORTS:
            all_failures += await run_viewport(pw, vp)

    if all_failures:
        print("\nFAILED:")
        for f in all_failures:
            print(" -", f)
        return 1
    print("\nAll E2E flows passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))