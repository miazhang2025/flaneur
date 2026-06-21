import { gsap } from '../lib/scroll.js'
import { initGrain } from '../lib/grain.js'

export function initCTA() {
  const cta = document.querySelector('.cta')
  if (!cta) return

  const grain = cta.querySelector('.grain')
  if (grain) initGrain(grain, { intensity: 0.22 })

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  gsap.from('.cta__inner > *', {
    y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.cta__inner', start: 'top 80%' },
  })
}
