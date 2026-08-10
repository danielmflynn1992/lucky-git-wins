"""Launch checklist: fails if placeholder tokens reach rendered HTML.

Run: python3 tests/e2e/launch_checklist.py
"""
import asyncio, re, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
PAGES = ["/", "/competitions", "/about", "/terms", "/privacy", "/faq", "/results"]
FORBIDDEN = [r"\[XXXXXXXX\]", r"\[Registered office address\]", r"\[[A-Z ]{4,}\]", r"lorem ipsum"]

async def main() -> int:
    failures = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        for path in PAGES:
            await page.goto(BASE + path, wait_until="domcontentloaded")
            await page.wait_for_timeout(600)
            body = await page.inner_text("body")
            for pattern in FORBIDDEN:
                for m in re.findall(pattern, body, flags=re.IGNORECASE):
                    failures.append(f"{path}: placeholder {m!r}")
        await browser.close()
    for f in failures:
        print("FAIL", f)
    print("Launch checklist:", "FAILED" if failures else "PASSED")
    return 1 if failures else 0

sys.exit(asyncio.run(main()))
