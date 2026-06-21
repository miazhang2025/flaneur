/**
 * Center-mirrored LCD waveform — the "breathing bars" from the prototype.
 * Faux envelope driven by a beat oscillator (no real PCM needed).
 */
export function initWaveform(canvas, opts = {}) {
  const { isPlaying = () => true, bars = 32 } = opts
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let W = 0, H = 0

  function size() {
    const r = canvas.getBoundingClientRect()
    if (!r.width) return
    W = canvas.width = Math.round(r.width * dpr)
    H = canvas.height = Math.round(r.height * dpr)
  }
  size()
  window.addEventListener('resize', size)

  const N = bars
  const buf = new Array(N).fill(0)
  let tt = 0
  let raf = 0

  function rr(c, x, y, w, h, r) {
    if (h < 1) { c.fillRect(x, y, w, 1.2); return }
    c.beginPath()
    c.moveTo(x + r, y)
    c.arcTo(x + w, y, x + w, y + h, r)
    c.arcTo(x + w, y + h, x, y + h, r)
    c.arcTo(x, y + h, x, y, r)
    c.arcTo(x, y, x + w, y, r)
    c.closePath()
  }

  function draw(staticFrame) {
    if (!W) { size(); if (!W) return }
    const mid = H / 2
    ctx.clearRect(0, 0, W, H)
    tt += 0.2
    const playing = isPlaying() && !staticFrame
    const beat = 0.45 + 0.55 * Math.pow(Math.abs(Math.sin(tt * 0.9)), 1.5)
    const flutter = 0.6 + 0.4 * Math.sin(tt * 5.3)
    const v = playing
      ? Math.min(1, (0.3 + 0.7 * Math.random()) * beat * flutter)
      : Math.max(0.04, buf[N - 1] - 0.06)
    buf.push(v); buf.shift()
    const bw = W / N
    for (let i = 0; i < N; i++) {
      const val = staticFrame ? 0.12 : buf[i]
      const bh = val * (H * 0.46)
      const x = i * bw + bw * 0.16
      const bwi = bw * 0.68
      const col = val < 0.5 ? '#41d18a' : val < 0.8 ? '#f0a020' : '#e8511e'
      ctx.fillStyle = col
      ctx.shadowColor = col
      ctx.shadowBlur = 5 * dpr
      rr(ctx, x, mid - bh, bwi, bh * 2, Math.min(bwi / 2, 2.5 * dpr))
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(true)
    return () => window.removeEventListener('resize', size)
  }

  let frame = 0
  function loop() {
    raf = requestAnimationFrame(loop)
    if (frame++ % 3 === 0) draw(false) // ~20fps — slower, calmer wave
  }
  raf = requestAnimationFrame(loop)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', size)
  }
}
