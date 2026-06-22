/**
 * Per-location song manager. Browsers block autoplay with sound, so nothing
 * plays until the first user gesture (the walkman play button) calls toggle().
 *
 * Songs don't all open on their intro: the first time one plays it starts at a
 * random offset, and after that it resumes from wherever it last left off.
 * Every start fades in. Gracefully no-ops when an audio file is missing.
 */
export function createAudio(neighborhoods, { volume = 0.85, fadeIn = 1400 } = {}) {
  const el = new Audio()
  el.loop = true
  el.preload = 'none'
  el.volume = 0

  let enabled = false
  let loaded = -1 // index whose src is in `el` (so el.currentTime belongs to it)
  let fadeRAF = 0
  const positions = new Array(neighborhoods.length).fill(null) // remembered time per song

  function fadeTo(target, ms = 600) {
    cancelAnimationFrame(fadeRAF)
    const start = el.volume
    const t0 = performance.now()
    return new Promise((resolve) => {
      const step = (t) => {
        // clamp: a frame timestamp can land just before t0, and a volume
        // outside [0,1] throws and would kill the fade
        const k = Math.max(0, Math.min(1, (t - t0) / ms))
        el.volume = start + (target - start) * k
        if (k < 1) fadeRAF = requestAnimationFrame(step)
        else resolve()
      }
      fadeRAF = requestAnimationFrame(step)
    })
  }

  function savePosition() {
    if (loaded >= 0 && isFinite(el.currentTime)) positions[loaded] = el.currentTime
  }

  async function load(i) {
    const song = neighborhoods[i] && neighborhoods[i].song
    if (!song) return
    savePosition() // remember where the outgoing song was
    try {
      if (!el.paused) await fadeTo(0, 240)
      el.src = song.src
      el.volume = 0
      loaded = i
      await el.play()
      // first play of this song → random offset; otherwise resume last position
      if (positions[i] == null && el.duration && isFinite(el.duration)) {
        positions[i] = Math.random() * Math.min(el.duration * 0.5, 75)
      }
      if (positions[i] != null) { try { el.currentTime = positions[i] } catch (e) { /* not seekable yet */ } }
      fadeTo(volume, fadeIn) // fade in at the (sought) position
    } catch (e) {
      /* missing file / blocked — keep the visual state, just no sound */
    }
  }

  return {
    get enabled() { return enabled },
    get current() { return loaded },
    isPlaying() { return enabled && !el.paused },

    /** play button. returns the new playing state */
    toggle(i) {
      if (!enabled) { enabled = true; load(i); return true }
      if (el.paused) {
        // resume the same song where it paused, or load a different one
        if (loaded === i && el.src) el.play().then(() => fadeTo(volume, fadeIn)).catch(() => {})
        else load(i)
        return true
      }
      savePosition()
      fadeTo(0, 280).then(() => el.pause())
      return false
    },

    /** location changed via scroll/next — crossfade if already playing */
    switchTo(i) {
      if (i === loaded) return
      if (!enabled || el.paused) return // not playing: the next play() will load the active one
      load(i)
    },

    /** leaving the section — fade out and pause, keeping position so play resumes */
    stop() {
      if (!enabled || el.paused) return
      savePosition()
      fadeTo(0, 700).then(() => { if (!el.paused) el.pause() })
    },
  }
}
