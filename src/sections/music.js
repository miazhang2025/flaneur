import { gsap, ScrollTrigger } from '../lib/scroll.js'
import { neighborhoods } from '../data/neighborhoods.js'
import { createAudio } from '../lib/audio.js'
// Three.js walkman is dynamically imported (heavy) — see ensureWalkman()

const N = neighborhoods.length

export function initMusic() {
  const music = document.querySelector('.music')
  const screen = document.getElementById('musicScreen')
  const stage = document.getElementById('musicStage')
  const lcd = document.getElementById('aboutLcd')
  if (!music || !screen || !stage) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- build the 5 stage panels ----------
  const panels = []
  const videos = []
  neighborhoods.forEach((n, i) => {
    const panel = document.createElement('div')
    panel.className = 'music__panel'
    panel.innerHTML = `
      <div class="music__ph" style="background:linear-gradient(150deg, ${n.grad[0]}, ${n.grad[1]})"></div>
      <video class="music__video" muted loop playsinline preload="auto"></video>
      <div class="music__text">
        <div class="music__coord">${n.coord}</div>
        <h3 class="music__name">${n.name}</h3>
        <div class="music__tag">${n.tag}</div>
        <div class="music__line">${n.line}</div>
      </div>`
    stage.appendChild(panel)
    panels.push(panel)

    // lazy video: only show if the real file actually loads
    const v = panel.querySelector('video')
    v.addEventListener('loadeddata', () => v.classList.add('ready'))
    const src = document.createElement('source')
    src.src = n.video; src.type = 'video/mp4'
    v.appendChild(src)
    v.load()
    videos.push(v)
  })

  // ---------- progress dots ----------
  const dotsWrap = document.getElementById('musicProgress')
  const dots = neighborhoods.map((n, i) => {
    const d = document.createElement('span')
    d.className = 'music__dot' + (i === 0 ? ' active' : '')
    d.title = n.name
    dotsWrap.appendChild(d)
    return d
  })

  // ---------- audio + walkman (walkman = lazy Three.js) ----------
  const audio = createAudio(neighborhoods)
  const walkmanEl = document.getElementById('walkman')
  let active = 0
  let walkman = null
  let walkmanReq = null
  function ensureWalkman() {
    if (walkman) return Promise.resolve(walkman)
    if (!walkmanReq) {
      walkmanReq = import('../three/walkman.js').then(({ initWalkman }) => {
        walkman = initWalkman(walkmanEl, {
          onPrev: () => scrollToIndex((active - 1 + N) % N),
          onPlayToggle: () => walkman.setPlaying(audio.toggle(active)),
          onNext: () => scrollToIndex((active + 1) % N),
        })
        walkman.setLocation(neighborhoods[active])
        return walkman
      })
    }
    return walkmanReq
  }
  const showWalkman = () => ensureWalkman().then((w) => w.show())
  const hideWalkman = () => walkman && walkman.hide()

  function setActive(i) {
    if (i === active) return
    active = i
    dots.forEach((d, k) => d.classList.toggle('active', k === i))
    if (walkman) walkman.setLocation(neighborhoods[i])
    audio.switchTo(i)
    videos.forEach((v, k) => {
      if (k === i) { v.play?.().catch(() => {}) } else { v.pause?.() }
    })
  }

  // warm the Three.js chunk up while still in About, so it's ready at Music
  ScrollTrigger.create({ trigger: '.about', start: 'top 40%', once: true, onEnter: ensureWalkman })

  // keyboard / screen-reader fallback controls
  walkmanEl?.querySelectorAll('[data-wk]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.wk
      if (a === 'prev') scrollToIndex((active - 1 + N) % N)
      else if (a === 'next') scrollToIndex((active + 1) % N)
      else ensureWalkman().then((w) => w.setPlaying(audio.toggle(active)))
    })
  })
  // kick the first video (if present)
  videos[0]?.play?.().catch(() => {})

  // ---------- grow: About LCD -> fullscreen ----------
  const setBox = (p) => {
    const r = lcd ? lcd.getBoundingClientRect() : { left: innerWidth / 2 - 180, top: innerHeight / 2 - 112, width: 360, height: 224 }
    screen.style.left = (r.left * (1 - p)) + 'px'
    screen.style.top = (r.top * (1 - p)) + 'px'
    screen.style.width = (r.width * (1 - p) + innerWidth * p) + 'px'
    screen.style.height = (r.height * (1 - p) + innerHeight * p) + 'px'
    screen.style.borderRadius = (16 * (1 - p)) + 'px'
    gsap.set(screen, { autoAlpha: Math.min(1, p / 0.05) })
    if (lcd) lcd.style.opacity = String(1 - Math.min(1, p / 0.18))
  }

  if (reduce) {
    setBox(1)
    ScrollTrigger.create({
      trigger: music, start: 'top center', end: 'bottom center',
      onToggle: (s) => { gsap.set(screen, { autoAlpha: s.isActive ? 1 : 0 }); s.isActive ? showWalkman() : hideWalkman() },
    })
  } else {
    ScrollTrigger.create({
      trigger: lcd || music, start: 'center 45%', endTrigger: music, end: 'top top',
      scrub: true, invalidateOnRefresh: true,
      onUpdate: (self) => setBox(self.progress),
      onLeaveBack: () => { gsap.set(screen, { autoAlpha: 0 }); if (lcd) lcd.style.opacity = '1' },
    })

    // fade out before Technical
    gsap.to(screen, {
      autoAlpha: 0, ease: 'power2.in',
      scrollTrigger: { trigger: music, start: 'bottom 80%', end: 'bottom 52%', scrub: true },
    })
  }

  // ---------- subsection crossfade + active index ----------
  const subST = ScrollTrigger.create({
    trigger: music, start: 'top top', end: 'bottom 88%',
    scrub: true,
    onUpdate: (self) => {
      const pos = self.progress * (N - 1)
      // each location holds full, then crossfades quickly only near the boundary
      const edge = 0.16
      panels.forEach((pn, i) => {
        const d = Math.abs(pos - i)
        const op = Math.max(0, Math.min(1, 1 - (d - (0.5 - edge)) / (2 * edge)))
        pn.style.opacity = String(op)
      })
      setActive(Math.round(pos))
    },
    onToggle: (self) => { self.isActive ? showWalkman() : hideWalkman() },
  })

  // ---------- next-button scroll ----------
  function scrollToIndex(i) {
    const target = subST.start + (i / (N - 1)) * (subST.end - subST.start)
    if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.1 })
    else window.scrollTo({ top: target, behavior: 'smooth' })
  }

  // safety: hide screen when Music fully out of view
  ScrollTrigger.create({
    trigger: music, start: 'top bottom', end: 'bottom top',
    onLeave: () => { gsap.set(screen, { autoAlpha: 0 }); hideWalkman() },
    onLeaveBack: () => { gsap.set(screen, { autoAlpha: 0 }); hideWalkman(); if (lcd) lcd.style.opacity = '1' },
  })
}
