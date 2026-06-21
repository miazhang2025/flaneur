"""Functional test: prev / play / next on the right-side walkman."""
import os
from playwright.sync_api import sync_playwright

OUT = "C:/Users/miazh/AppData/Local/Temp/flaneur-shots"
os.makedirs(OUT, exist_ok=True)
URL = "http://localhost:5173"

def scroll(page, y):
    page.evaluate("(y)=>window.__lenis?window.__lenis.scrollTo(y,{immediate:true}):scrollTo(0,y)", y)
    page.wait_for_timeout(900)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    page.goto(URL, wait_until="load"); page.wait_for_timeout(3500)
    top = page.evaluate("()=>document.querySelector('#music').offsetTop")

    # start at location 2 (so prev and next both have room)
    scroll(page, int(top + 3420 * 0.5))
    box = page.evaluate("()=>{const c=document.querySelector('#walkman canvas');const r=c.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}")
    print("walkman:", box)
    bx = lambda fx, fy: (box["x"] + box["w"] * fx, box["y"] + box["h"] * fy)
    Y = 0.74

    def idx():
        return page.evaluate("()=>[...document.querySelectorAll('.music__dot')].findIndex(d=>d.classList.contains('active'))")

    print("start idx:", idx())
    page.mouse.click(*bx(0.50, Y)); page.wait_for_timeout(700)  # play
    page.screenshot(path=f"{OUT}/wk-play.png", clip={"x":box["x"],"y":box["y"],"width":box["w"],"height":box["h"]})

    page.mouse.click(*bx(0.67, Y)); page.wait_for_timeout(1700)  # next
    print("after next idx:", idx())
    page.mouse.click(*bx(0.33, Y)); page.wait_for_timeout(1700)  # prev
    print("after prev idx:", idx())
    page.screenshot(path=f"{OUT}/wk-after.png", clip={"x":box["x"],"y":box["y"],"width":box["w"],"height":box["h"]})

    browser.close()
