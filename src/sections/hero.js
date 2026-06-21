import { gsap } from '../lib/scroll.js'
import { initGrain } from '../lib/grain.js'
import { CITIES, randomCity } from '../data/cities.js'

export function initHero() {
  const hero = document.querySelector('.hero')
  if (!hero) return

  const mapEl = document.getElementById('heroMap')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---- map background (heavy — lazy-loaded so the hero paints first) ----
  let mapApi = null
  const mapReady = import('../lib/map.js').then(({ initMap, flyToCity }) => {
    const map = mapEl ? initMap(mapEl) : null
    mapApi = { map, flyToCity }
    if (!reduce && map && mapEl) {
      gsap.fromTo(mapEl, { scale: 1.04 }, {
        scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      })
    }
    return mapApi
  })
  const fly = (city) => mapReady.then((api) => api.map && api.flyToCity(api.map, city))

  // ---- city selector (renders immediately) ----
  const sel = document.getElementById('citySelect')
  if (sel) {
    const more = document.createElement('button')
    more.className = 'city city--more'; more.type = 'button'; more.textContent = 'More'; more.setAttribute('role', 'tab')
    let lastRandom = null

    CITIES.forEach((c, i) => {
      const b = document.createElement('button')
      b.className = 'city' + (i === 0 ? ' active' : '')
      b.type = 'button'; b.textContent = c.name; b.dataset.city = c.id; b.setAttribute('role', 'tab')
      b.addEventListener('click', () => {
        sel.querySelectorAll('.city').forEach((x) => x.classList.remove('active'))
        b.classList.add('active'); more.textContent = 'More'
        fly(c)
      })
      sel.appendChild(b)
    })

    more.addEventListener('click', () => {
      const c = randomCity(lastRandom); lastRandom = c.name
      sel.querySelectorAll('.city').forEach((x) => x.classList.remove('active'))
      more.classList.add('active'); more.textContent = c.name
      fly(c)
    })
    sel.appendChild(more)
  }

  // ---- dynamic grain (subtle) ----
  const grainCanvas = hero.querySelector('.grain')
  if (grainCanvas) initGrain(grainCanvas, { intensity: 0.3 })

  if (reduce) return

  // ---- entrance ----
  const title = hero.querySelector('.hero__title')
  const leads = hero.querySelectorAll('.hero__lead span')
  const cue = hero.querySelector('.scroll-cue')
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.from(title, { yPercent: 16, autoAlpha: 0, filter: 'blur(14px)', duration: 1.2 }, 0)
    .from(leads, { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.14 }, 0.55)
    .from(sel, { y: 14, autoAlpha: 0, duration: 0.8 }, 0.9)
    .from(cue, { autoAlpha: 0, duration: 0.6 }, 1.1)

  // ---- scroll parallax on the foreground ----
  gsap.to(hero.querySelector('.hero__fg'), {
    yPercent: -16, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  })
}
