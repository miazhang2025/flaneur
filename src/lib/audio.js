/**
 * Per-location song manager. Browsers block autoplay with sound, so nothing
 * plays until the first user gesture (the walkman play button) calls toggle().
 * Gracefully no-ops when an audio file is missing.
 */
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function createAudio(neighborhoods, { volume = 0.85 } = {}) {
  const el = new Audio()
  el.loop = true
  el.preload = 'none'
  el.volume = 0

  let enabled = false
  let current = -1
  let fadeRAF = 0

  function fadeTo(target, ms = 600) {
    cancelAnimationFrame(fadeRAF)
    const start = el.volume
    const t0 = performance.now()
    return new Promise((resolve) => {
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms)
        el.volume = start + (target - start) * k
        if (k < 1) fadeRAF = requestAnimationFrame(step)
        else resolve()
      }
      fadeRAF = requestAnimationFrame(step)
    })
  }

  async function load(i) {
    const song = neighborhoods[i] && neighborhoods[i].song
    if (!song) return
    current = i
    try {
      if (!el.paused) { await fadeTo(0, 220) }
      el.src = song.src
      el.currentTime = 0
      await el.play()
      fadeTo(volume, 700)
    } catch (e) {
      /* missing file / blocked — keep the visual state, just no sound */
    }
  }

  return {
    get enabled() { return enabled },
    get current() { return current },
    isPlaying() { return enabled && !el.paused },

    /** play button. returns the new playing state */
    toggle(i) {
      if (!enabled) { enabled = true; load(i); return true }
      if (el.paused) { load(i); return true }
      fadeTo(0, 280).then(() => el.pause())
      return false
    },

    /** location changed via scroll/next — crossfade if already playing */
    switchTo(i) {
      if (i === current) return
      if (!enabled || el.paused) { current = i; return }
      load(i)
    },
  }
}
