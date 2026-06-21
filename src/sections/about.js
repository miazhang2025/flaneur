import { gsap } from '../lib/scroll.js'
import { initWaveform } from '../lib/waveform.js'

export function initAbout() {
  const about = document.querySelector('.about')
  if (!about) return

  // ---- animated LCD waveform ----
  const wave = document.getElementById('aboutWave')
  if (wave) initWaveform(wave, { isPlaying: () => true })

  // ---- layer switches ----
  about.querySelectorAll('[data-sw]').forEach((sw) => {
    sw.addEventListener('click', () => {
      const on = sw.classList.toggle('on')
      sw.setAttribute('aria-pressed', String(on))
    })
  })

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  // ---- scroll reveals ----
  gsap.from('.about .eyebrow', {
    y: 16, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.about__text', start: 'top 84%' },
  })
  gsap.from('.about__title', {
    y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.about__title', start: 'top 84%' },
  })
  gsap.from('.about__body p', {
    y: 22, autoAlpha: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.about__body', start: 'top 82%' },
  })
  gsap.from('.about .btn-accent', {
    y: 18, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.about .btn-accent', start: 'top 90%' },
  })
  gsap.from('.about__panel', {
    y: 36, autoAlpha: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: '.about__panel', start: 'top 82%' },
  })
}
