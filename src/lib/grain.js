/**
 * Dynamic film grain.
 * Pre-renders a handful of noise tiles once, then cycles them each frame
 * with a random sub-tile offset — a cheap "boiling" grain that never
 * regenerates pixel data in the hot loop.
 */
export function initGrain(canvas, opts = {}) {
  const {
    intensity = 0.55, // 0–1, multiplied on top of the canvas's CSS blend
    fps = 24,
    tile = 128,
    frames = 8,
  } = opts

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return () => {}

  // ---- build noise tiles + patterns once ----
  const patterns = []
  for (let f = 0; f < frames; f++) {
    const t = document.createElement('canvas')
    t.width = t.height = tile
    const tctx = t.getContext('2d')
    const img = tctx.createImageData(tile, tile)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0
      d[i] = d[i + 1] = d[i + 2] = v
      d[i + 3] = 255
    }
    tctx.putImageData(img, 0, 0)
    patterns.push(ctx.createPattern(t, 'repeat'))
  }

  function resize() {
    const r = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(r.width))
    canvas.height = Math.max(1, Math.floor(r.height))
  }
  resize()
  window.addEventListener('resize', resize)

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function paint(i, ox, oy) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = intensity
    ctx.fillStyle = patterns[i]
    ctx.save()
    ctx.translate(-ox, -oy)
    ctx.fillRect(ox, oy, canvas.width, canvas.height)
    ctx.restore()
  }

  if (reduce) {
    paint(0, 0, 0)
    return () => window.removeEventListener('resize', resize)
  }

  let raf = 0
  let last = 0
  let i = 0
  let visible = true
  const interval = 1000 / fps

  function loop(now) {
    raf = requestAnimationFrame(loop)
    if (!visible || now - last < interval) return
    last = now
    i = (i + 1) % patterns.length
    paint(i, (Math.random() * tile) | 0, (Math.random() * tile) | 0)
  }
  raf = requestAnimationFrame(loop)

  // pause when the hero scrolls out of view
  const io = new IntersectionObserver(
    ([e]) => { visible = e.isIntersecting },
    { threshold: 0 }
  )
  io.observe(canvas)

  return () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    window.removeEventListener('resize', resize)
  }
}
