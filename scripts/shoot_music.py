"""Capture the Music stage (5 locations) + the 3D walkman at several scroll points."""
import os
from playwright.sync_api import sync_playwright

OUT = "C:/Users/miazh/AppData/Local/Temp/flaneur-shots"
os.makedirs(OUT, exist_ok=True)
URL = "http://localhost:5173"

def scroll_to(page, y):
    page.evaluate("""(y)=>{ if(window.__lenis) window.__lenis.scrollTo(y,{immediate:true}); else window.scrollTo(0,y); }""", y)
    page.wait_for_timeout(900)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    errs = []
    page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
    page.goto(URL, wait_until="load")
    page.wait_for_timeout(3500)

    pos = page.evaluate("""()=>{ const m=document.querySelector('#music'); return {top:m.offsetTop, h:m.offsetHeight, vh:innerHeight}; }""")
    print("POS:", pos)
    top, h, vh = pos["top"], pos["h"], pos["vh"]

    # location 0 (just fullscreen)
    scroll_to(page, top + 120)
    page.screenshot(path=f"{OUT}/m0-chinatown.png")

    # ~location 2
    scroll_to(page, int(top + (h - vh) * 0.5))
    page.screenshot(path=f"{OUT}/m2-mid.png")

    # ~location 4
    scroll_to(page, int(top + (h - vh) * 0.92))
    page.screenshot(path=f"{OUT}/m4-harlem.png")

    browser.close()
    print("ERRORS:", len(errs))
    for e in errs[:20]:
        print(" -", e)
