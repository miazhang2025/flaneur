import { gsap, ScrollTrigger } from '../lib/scroll.js'

const SCRIPT = `$ flaneur --explain "why this song?"

> gps.locate()              # block-level position
> hood = identity(here)     # anchor tracks · mood tags · region
> pool = lastfm(hood)       # getSimilar · tagTop · geoTop
> pool = rerank(pool, you)  # your listening, lightly
> track = resolve(pool)     # → Spotify URI, then play

✓ the song that belongs here`

export function initTechnical() {
  const sec = document.querySelector('.technical')
  if (!sec) return

  const code = document.getElementById('techCode')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // weight bars (always animate the fill, or set it for reduced motion)
  sec.querySelectorAll('.wrow').forEach((row) => {
    const w = (+row.dataset.w) / 100
    const fill = row.querySelector('.wrow__fill')
    if (reduce) { gsap.set(fill, { scaleX: w }); return }
    gsap.to(fill, {
      scaleX: w, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: row, start: 'top 86%' },
    })
  })

  if (reduce) {
    if (code) code.textContent = SCRIPT
    return
  }

  // head + law reveals
  gsap.from('.tech__head > *', {
    y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.tech__head', start: 'top 82%' },
  })
  gsap.from('.tech__rule > *', {
    y: 20, autoAlpha: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.tech__rule', start: 'top 88%' },
  })

  // typewriter console (once)
  if (code) {
    ScrollTrigger.create({
      trigger: '.tech__console', start: 'top 74%', once: true,
      onEnter: () => typewriter(code, SCRIPT, 52),
    })
  }
}

function typewriter(el, text, cps = 50) {
  el.textContent = ''
  let i = 0
  const iv = setInterval(() => {
    el.textContent += text[i++]
    if (i >= text.length) clearInterval(iv)
  }, 1000 / cps)
}
