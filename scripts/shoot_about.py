"""Capture the About section + the green-screen zoom transition into Music."""
import sys, os
from playwright.sync_api import sync_playwright

OUT = "C:/Users/miazh/AppData/Local/Temp/flaneur-shots"
os.makedirs(OUT, exist_ok=True)
URL = "http://localhost:5173"

def scroll_to(page, y):
    page.evaluate(
        """(y) => { if (window.__lenis) window.__lenis.scrollTo(y, {immediate:true}); else window.scrollTo(0,y); }""",
        y,
    )
    page.wait_for_timeout(700)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    errs = []
    page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error",) else None)
    page.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
    page.goto(URL, wait_until="load")
    page.wait_for_timeout(3500)

    pos = page.evaluate("""() => {
      const o = document.querySelector('#origin'); const m = document.querySelector('#music');
      return { aboutTop:o.offsetTop, musicTop:m.offsetTop, musicH:m.offsetHeight, vh: innerHeight };
    }""")
    print("POS:", pos)

    scroll_to(page, pos["aboutTop"] + 40)
    page.screenshot(path=f"{OUT}/a1-about.png")

    scroll_to(page, int(pos["musicTop"] - pos["vh"] * 0.7))
    page.screenshot(path=f"{OUT}/a2-zoom-early.png")

    scroll_to(page, int(pos["musicTop"] - pos["vh"] * 0.35))
    page.screenshot(path=f"{OUT}/a2b-zoom-mid.png")

    scroll_to(page, pos["musicTop"] + 200)
    page.screenshot(path=f"{OUT}/a3-fullscreen.png")

    scroll_to(page, int(pos["musicTop"] + pos["musicH"] - pos["vh"] * 0.9))
    page.screenshot(path=f"{OUT}/a4-fadeout.png")

    browser.close()
    print("ERRORS:", len(errs))
    for e in errs[:20]:
        print(" -", e)
