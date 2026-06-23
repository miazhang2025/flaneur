import './styles/tokens.css'
import './styles/deck.css'
import { neighborhoods } from './data/neighborhoods.js'
import { createAudio } from './lib/audio.js'
import { initWalkman } from './three/walkman.js'

const deck = document.getElementById('deck')
const pages = [...document.querySelectorAll('.slide')]
const byId = (id) => document.getElementById(id)

/* ---------- build the 5 music panels + dots ---------- */
const mStage = byId('mStage')
const mDots = byId('mDots')
const musicLayer = byId('musicLayer')
const panels = []
const videos = []
neighborhoods.forEach((n) => {
  const panel = document.createElement('div')
  panel.className = 'm-panel'
  panel.innerHTML = `
    <div class="m-ph" style="background:linear-gradient(150deg, ${n.grad[0]}, ${n.grad[1]})"></div>
    <video class="m-video" muted loop playsinline preload="auto"></video>
    <div class="m-text">
      <div class="m-coord">${n.coord}</div>
      <h3 class="m-name">${n.name}</h3>
      <div class="m-tag">${n.tag}</div>
      <div class="m-line">${n.line}</div>
      <div class="m-song">♪ ${n.song.title} · ${n.song.artist}</div>
    </div>`
  mStage.appendChild(panel)
  panels.push(panel)

  const v = panel.querySelector('video')
  v.addEventListener('loadeddata', () => v.classList.add('ready'))
  const src = document.createElement('source')
  src.src = n.video; src.type = 'video/mp4'
  v.appendChild(src); v.load()
  videos.push(v)

  const d = document.createElement('span')
  d.className = 'm-dot'; d.title = n.name
  mDots.appendChild(d)
})
const dots = [...mDots.children]

// screen-recording videos on the demo slides: reveal once they load
document.querySelectorAll('video[data-demo]').forEach((v) => {
  v.addEventListener('loadeddata', () => v.classList.add('ready'))
})

/* ---------- audio + walkman (the real modules, unchanged) ---------- */
const audio = createAudio(neighborhoods)
const walkmanEl = byId('walkman')
const N = neighborhoods.length
let activeMusic = 0

const walkman = initWalkman(walkmanEl, {
  onPrev: () => gotoMusic((musicPos() - 1 + N) % N),
  onPlayToggle: () => walkman.setPlaying(audio.toggle(activeMusic)),
  onNext: () => gotoMusic((musicPos() + 1) % N),
})
walkman.setLocation(neighborhoods[0])

// screen-reader / keyboard fallback buttons on the walkman
walkmanEl.querySelectorAll('[data-wk]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const a = btn.dataset.wk
    if (a === 'prev') gotoMusic((musicPos() - 1 + N) % N)
    else if (a === 'next') gotoMusic((musicPos() + 1) % N)
    else walkman.setPlaying(audio.toggle(activeMusic))
  })
})

/* ---------- slide order (20) ---------- */
const order = [
  { kind: 'page', id: 's-title' },
  { kind: 'page', id: 's-app' },
  { kind: 'page', id: 's-word' },
  { kind: 'page', id: 's-origin' },
  { kind: 'page', id: 's-rule' },
  { kind: 'music', mi: 0 },
  { kind: 'music', mi: 1 },
  { kind: 'music', mi: 2 },
  { kind: 'music', mi: 3 },
  { kind: 'music', mi: 4 },
  { kind: 'page', id: 's-demo1' },
  { kind: 'page', id: 's-demo2' },
  { kind: 'page', id: 's-demo3' },
  { kind: 'page', id: 's-demo4' },
  { kind: 'page', id: 's-engine' },
  { kind: 'page', id: 's-layers' },
  { kind: 'page', id: 's-stack' },
  { kind: 'page', id: 's-map' },
  { kind: 'page', id: 's-soon' },
  { kind: 'page', id: 's-close' },
]
const total = order.length
const musicOrderIdx = order.map((o, i) => (o.kind === 'music' ? i : -1)).filter((i) => i >= 0)
const musicPos = () => musicOrderIdx.indexOf(cur)          // 0..4 when on a music slide
const isMusic = (i) => order[i].kind === 'music'

let cur = 0, auto = false, paused = false, timer = null

/* ---------- chrome refs ---------- */
const pk = byId('pk')
const barPlace = byId('barPlace')
const barCoord = byId('barCoord')
const barNum = byId('barNum')
const barMode = byId('barMode')
const hint = byId('hint')

/* ---------- music enter / leave ---------- */
function enterMusic(mi) {
  activeMusic = mi
  musicLayer.classList.add('on')
  musicLayer.setAttribute('aria-hidden', 'false')
  panels.forEach((p, k) => p.classList.toggle('on', k === mi))
  videos.forEach((v, k) => { if (k === mi) v.play?.().catch(() => {}); else v.pause?.() })
  dots.forEach((d, k) => d.classList.toggle('active', k === mi))
  walkman.setLocation(neighborhoods[mi])
  walkman.show()
  // audio: start/resume this location's song; crossfade if already playing.
  // (the first play needs a user gesture — navigating with a key/click counts.)
  if (!audio.isPlaying()) walkman.setPlaying(audio.toggle(mi))
  else { audio.switchTo(mi); walkman.setPlaying(true) }
  barPlace.textContent = neighborhoods[mi].name
  barCoord.textContent = '· ' + neighborhoods[mi].coord
}
function leaveMusic() {
  if (!musicLayer.classList.contains('on')) return
  musicLayer.classList.remove('on')
  musicLayer.setAttribute('aria-hidden', 'true')
  audio.stop()
  walkman.setPlaying(false)
  walkman.hide()
  videos.forEach((v) => v.pause?.())
}

/* ---------- show a slide ---------- */
function render() {
  const o = order[cur]
  if (o.kind === 'music') {
    pages.forEach((s) => s.classList.remove('active'))
    deck.dataset.theme = 'film'
    enterMusic(o.mi)
  } else {
    leaveMusic()
    const el = byId(o.id)
    pages.forEach((s) => {
      const on = s === el
      s.classList.toggle('active', on)
      // play this slide's screen-recording, pause the rest
      s.querySelectorAll('video[data-demo]').forEach((v) => { on ? v.play?.().catch(() => {}) : v.pause?.() })
    })
    deck.dataset.theme = el.classList.contains('theme-dark') ? 'dark' : 'paper'
    barPlace.textContent = el.dataset.place || 'FLÂNEUR'
    barCoord.textContent = el.dataset.coord && el.dataset.coord !== '—' ? '· ' + el.dataset.coord : ''
  }
  barNum.textContent = String(cur + 1).padStart(2, '0')
  if (auto) startTimer()
}

function go(i) { cur = Math.max(0, Math.min(total - 1, i)); render() }
function next() { if (cur < total - 1) go(cur + 1); else if (auto) stopAuto() }
function prev() { go(cur - 1) }
function gotoMusic(pos) { go(musicOrderIdx[pos]) }   // walkman prev/next cycles the 5 locations

/* ---------- Pecha Kucha auto-advance (20s) ---------- */
function startTimer() {
  clearTimeout(timer)
  pk.classList.add('run'); pk.style.transition = 'none'; pk.style.width = '0'
  void pk.offsetWidth
  if (!paused) {
    pk.style.transition = 'width 20s linear'; pk.style.width = '100%'
    timer = setTimeout(() => { if (cur < total - 1) next(); else stopAuto() }, 20000)
  }
}
function stopAuto() {
  auto = false; paused = false; clearTimeout(timer)
  pk.classList.remove('run'); pk.style.width = '0'
  barMode.textContent = 'MANUAL'; barMode.classList.remove('on')
}
function toggleAuto() {
  auto = !auto
  if (auto) { paused = false; barMode.textContent = 'AUTO · 20s'; barMode.classList.add('on'); startTimer() }
  else stopAuto()
}
function togglePause() {
  if (!auto) return
  paused = !paused
  if (paused) {
    clearTimeout(timer)
    const w = pk.getBoundingClientRect().width
    pk.style.transition = 'none'; pk.style.width = w + 'px'; barMode.textContent = 'PAUSED'
  } else {
    barMode.textContent = 'AUTO · 20s'
    const w = pk.getBoundingClientRect().width
    const full = pk.parentElement.getBoundingClientRect().width
    const remain = Math.max(2, (1 - w / full) * 20)
    pk.style.transition = `width ${remain}s linear`; pk.style.width = '100%'
    clearTimeout(timer); timer = setTimeout(() => { if (cur < total - 1) next(); else stopAuto() }, remain * 1000)
  }
}

/* ---------- controls ---------- */
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown': case 'Enter': e.preventDefault(); next(); break
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); prev(); break
    case ' ': e.preventDefault()
      if (auto) togglePause()
      else if (isMusic(cur)) walkman.setPlaying(audio.toggle(activeMusic))  // play/pause the song
      else next()
      break
    case 'a': case 'A': toggleAuto(); break
    case 'f': case 'F': toggleFull(); break
    case 'Home': go(0); break
    case 'End': go(total - 1); break
  }
})
byId('next').addEventListener('click', next)
byId('prev').addEventListener('click', prev)

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
  else document.exitFullscreen?.()
}

/* dismiss hint after first action or 6s */
let hinted = false
function dropHint() { if (hinted) return; hinted = true; hint.style.opacity = '0'; setTimeout(() => hint.remove(), 700) }
document.addEventListener('keydown', dropHint, { once: true })
document.addEventListener('click', dropHint, { once: true })
setTimeout(dropHint, 6000)

window.addEventListener('resize', () => { /* walkman handles its own resize */ })

// cover: real Mapbox map (same custom paper style as the site, via the repo's initMap)
import('./lib/map.js')
  .then(({ initMap }) => {
    const el = document.getElementById('coverMap')
    if (!el) return
    const map = initMap(el)
    map.on('load', () => {
      map.jumpTo({ center: [-73.9700, 40.7720], zoom: 11.2 })  // frame Manhattan
      map.resize()
    })
  })
  .catch((e) => console.warn('[deck] cover map failed to load', e))

render()
