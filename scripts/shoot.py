"""Smoke-test the Flâneur site: capture console errors + section screenshots.
Dev server must already be running on http://localhost:5173.
Usage: python scripts/shoot.py [out_dir]
"""
import sys
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else "C:/Users/miazh/AppData/Local/Temp/flaneur-shots"
import os
os.makedirs(OUT, exist_ok=True)

URL = "http://localhost:5173"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)

    errors = []
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))

    page.goto(URL, wait_until="load")
    page.wait_for_timeout(4500)  # let entrance animation + map tiles settle

    page.screenshot(path=f"{OUT}/01-hero-top.png")

    # "More" -> random city
    try:
        page.click("text=More", timeout=3000)
        page.wait_for_timeout(3200)  # flyTo duration
        page.screenshot(path=f"{OUT}/02-hero-more.png")
    except Exception as e:
        print("more click failed:", e)

    # jump to about (header should invert to ink text)
    page.evaluate("document.querySelector('#origin').scrollIntoView({behavior:'instant'})")
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/03-about.png")

    browser.close()

print("OUT_DIR:", OUT)
print("CONSOLE_ISSUES:", len(errors))
for e in errors[:40]:
    print(" -", e)
