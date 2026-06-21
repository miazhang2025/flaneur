from playwright.sync_api import sync_playwright

URL = "http://localhost:5173"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    logs = []
    page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: logs.append(f"[pageerror] {e}"))
    page.goto(URL, wait_until="load")
    page.wait_for_timeout(5000)

    info = page.evaluate("""() => {
      const el = document.getElementById('heroMap')
      const cvs = el && el.querySelector('canvas')
      return {
        heroMapRect: el ? {w: el.clientWidth, h: el.clientHeight} : null,
        hasCanvas: !!cvs,
        canvasSize: cvs ? {w: cvs.width, h: cvs.height} : null,
        mapboxglPresent: typeof window.mapboxgl !== 'undefined',
        childHTML: el ? el.innerHTML.slice(0, 200) : null,
      }
    }""")
    print("INFO:", info)
    print("--- console ---")
    for l in logs:
        if 'WebGL' in l or 'ReadPixels' in l or 'GPU stall' in l:
            continue
        print(l)
    browser.close()
