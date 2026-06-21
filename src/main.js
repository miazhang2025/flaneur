import './styles/tokens.css'
import './styles/base.css'
import './styles/sections.css'

import { initSmoothScroll } from './lib/scroll.js'
import { initHero } from './sections/hero.js'
import { initAbout } from './sections/about.js'
import { initMusic } from './sections/music.js'
import { initTechnical } from './sections/technical.js'
import { initCTA } from './sections/cta.js'

const lenis = initSmoothScroll()
initHero()
initAbout()
initMusic()
initTechnical()
initCTA()

/* ---- header: white text, inverts to ink over light sections (transparent throughout) ---- */
const header = document.querySelector('.site-header')
const lightSections = new Set(['origin', 'wishlist'])
function updateHeaderTheme() {
  const y = window.scrollY + 34
  let overLight = false
  for (const s of document.querySelectorAll('.section')) {
    if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) {
      overLight = lightSections.has(s.id)
      break
    }
  }
  header.classList.toggle('over-light', overLight)
}
updateHeaderTheme()
window.addEventListener('scroll', updateHeaderTheme, { passive: true })
window.addEventListener('resize', updateHeaderTheme)

/* ---- mobile nav ---- */
const toggle = document.querySelector('.nav-toggle')
toggle?.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open')
  toggle.setAttribute('aria-expanded', String(open))
})

/* ---- apply configurable links (waitlist / contact) ---- */
import { WAITLIST_URL, CONTACT_EMAIL, INSTAGRAM_URL } from './config.js'
if (WAITLIST_URL) {
  document.querySelectorAll('[data-waitlist]').forEach((a) => {
    a.setAttribute('href', WAITLIST_URL)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener')
  })
}
if (CONTACT_EMAIL) {
  document.querySelectorAll('a[data-contact][href^="mailto"]').forEach((a) => {
    a.setAttribute('href', `mailto:${CONTACT_EMAIL}`)
    if (a.textContent.includes('@') && a.textContent.includes('.')) a.textContent = CONTACT_EMAIL
  })
}
if (INSTAGRAM_URL) {
  document.querySelectorAll('a[data-contact][href="#"]').forEach((a) => {
    a.setAttribute('href', INSTAGRAM_URL)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener')
  })
}

/* ---- anchor nav through Lenis (falls back to native) ---- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    if (!id || id === '#') return
    const target = document.querySelector(id)
    if (!target) return
    e.preventDefault()
    document.body.classList.remove('nav-open')
    if (lenis) lenis.scrollTo(target, { offset: 0 })
    else target.scrollIntoView({ behavior: 'smooth' })
  })
})
