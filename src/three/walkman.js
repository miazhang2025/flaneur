import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/**
 * Procedural matte-plastic "walkman" styled to the Flâneur UI.
 * Sharp-edged warm-grey body, recessed green LCD, and a single row of three
 * buttons: prev · play/pause · next. Hover tilts it toward the cursor; the
 * buttons raycast to the supplied handlers.
 */
export function initWalkman(container, handlers = {}) {
  const { onPrev = () => {}, onPlayToggle = () => {}, onNext = () => {} } = handlers
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 9.6)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const key = new THREE.DirectionalLight(0xfff2e0, 1.45); key.position.set(-5, 7, 6); scene.add(key)
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.45); fill.position.set(6, -2, 4); scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(0, 2, -7); scene.add(rim)

  const group = new THREE.Group()
  group.rotation.set(0.04, -0.1, 0)
  scene.add(group)

  // ---- matte plastic materials ----
  const matte = (color, r = 0.92) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: 0.0 })
  const bodyMat = matte(0xd6d2ca, 0.92)
  const plateMat = matte(0xccc8c0, 0.96)
  const greyMat = matte(0xe7e2d6, 0.88)
  const playMat = matte(0xe8511e, 0.82)
  const inkDark = matte(0x4a463f, 0.7)
  const inkCream = matte(0xfff4ee, 0.7)

  // ---- body (sharp edges) ----
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.9, 4.7, 0.66, 2, 0.05), bodyMat)
  group.add(body)
  const plate = new THREE.Mesh(new RoundedBoxGeometry(2.54, 4.26, 0.12, 2, 0.04), plateMat)
  plate.position.set(0, 0, 0.3)
  group.add(plate)

  // ---- LCD ----
  const lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 512; lcdCanvas.height = 280
  const lcdTex = new THREE.CanvasTexture(lcdCanvas); lcdTex.colorSpace = THREE.SRGBColorSpace
  const lcdMat = new THREE.MeshStandardMaterial({ map: lcdTex, emissive: 0xffffff, emissiveMap: lcdTex, emissiveIntensity: 0.5, roughness: 0.35 })
  const lcd = new THREE.Mesh(new RoundedBoxGeometry(2.32, 1.34, 0.1, 2, 0.05), lcdMat)
  lcd.position.set(0, 1.18, 0.38)
  group.add(lcd)

  // ---- 3 buttons in a row: prev · play · next ----
  const ROW_Y = -1.05, BZ = 0.42, GZ = 0.6
  function makeButton(x, mat, r = 0.33, name) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 44), mat)
    b.rotation.x = Math.PI / 2; b.position.set(x, ROW_Y, BZ); b.name = name
    group.add(b); return b
  }
  const prevBtn = makeButton(-0.86, greyMat, 0.33, 'prev')
  const playBtn = makeButton(0, playMat, 0.4, 'play')
  const nextBtn = makeButton(0.86, greyMat, 0.33, 'next')

  // glyphs (flat triangles point +x by default)
  const tri = (r) => new THREE.CircleGeometry(r, 3)
  const bar = (h) => new THREE.BoxGeometry(0.05, h, 0.04)
  const pressables = []
  function glyph(mesh, name) { mesh.name = name; group.add(mesh); pressables.push(mesh); return mesh }

  // prev: |◀
  const prevTri = glyph(new THREE.Mesh(tri(0.12), inkDark), 'prev'); prevTri.rotation.z = Math.PI; prevTri.position.set(-0.82, ROW_Y, GZ)
  const prevBar = glyph(new THREE.Mesh(bar(0.24), inkDark), 'prev'); prevBar.position.set(-0.98, ROW_Y, GZ)
  // next: ▶|
  const nextTri = glyph(new THREE.Mesh(tri(0.12), inkDark), 'next'); nextTri.position.set(0.82, ROW_Y, GZ)
  const nextBar = glyph(new THREE.Mesh(bar(0.24), inkDark), 'next'); nextBar.position.set(0.98, ROW_Y, GZ)
  // play / pause (toggled)
  const playTri = glyph(new THREE.Mesh(tri(0.16), inkCream), 'play'); playTri.position.set(0.02, ROW_Y, GZ + 0.02)
  const pauseL = glyph(new THREE.Mesh(bar(0.3), inkCream), 'play'); pauseL.position.set(-0.08, ROW_Y, GZ + 0.02)
  const pauseR = glyph(new THREE.Mesh(bar(0.3), inkCream), 'play'); pauseR.position.set(0.08, ROW_Y, GZ + 0.02)
  pauseL.visible = pauseR.visible = false
  pressables.push(prevBtn, playBtn, nextBtn)

  // ---- brand plate (lower area) ----
  const brandCanvas = document.createElement('canvas'); brandCanvas.width = 512; brandCanvas.height = 140
  const bctx = brandCanvas.getContext('2d')
  bctx.clearRect(0, 0, 512, 140)
  bctx.fillStyle = '#8a857b'; bctx.textAlign = 'center'
  bctx.font = '800 60px Georgia, serif'; bctx.letterSpacing = '10px'
  bctx.fillText('FLÂNEUR', 256, 64)
  bctx.font = '700 26px ui-monospace, monospace'; bctx.letterSpacing = '8px'
  bctx.fillText('SOUND ATLAS', 256, 104)
  const brandTex = new THREE.CanvasTexture(brandCanvas); brandTex.colorSpace = THREE.SRGBColorSpace
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), new THREE.MeshBasicMaterial({ map: brandTex, transparent: true }))
  brand.position.set(0, -2.05, 0.37)
  group.add(brand)

  // ---- LCD drawing ----
  let placeText = 'Chinatown'
  let metaText = '40.715°N 73.997°W'
  let playing = false
  let tt = 0
  const wbars = new Array(24).fill(0.1)
  // same monospace stack as the section-2 LCD (--font-mono)
  const MONO = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || '"SF Mono", ui-monospace, monospace'

  function drawLCD() {
    const c = lcdCanvas.getContext('2d')
    c.fillStyle = '#16201c'; c.fillRect(0, 0, 512, 280)
    c.fillStyle = 'rgba(0,0,0,.18)'
    for (let y = 0; y < 280; y += 4) c.fillRect(0, y, 512, 2)
    c.fillStyle = '#7df0b0'; c.shadowColor = '#7df0b0'; c.shadowBlur = 18; c.textAlign = 'left'
    let size = 58
    c.font = `600 ${size}px ${MONO}`
    while (c.measureText(placeText).width > 460 && size > 30) { size -= 2; c.font = `600 ${size}px ${MONO}` }
    c.fillText(placeText, 26, 80)
    c.shadowBlur = 0
    c.fillStyle = 'rgba(125,240,176,.62)'; c.font = `24px ${MONO}`
    c.fillText(metaText, 26, 120)
    c.fillStyle = playing ? '#e8511e' : 'rgba(125,240,176,.5)'; c.font = `700 20px ${MONO}`
    c.fillText(playing ? '▶ PLAYING' : '❚❚ PAUSED', 26, 156)
    const baseY = 238, bw = 512 / wbars.length
    for (let i = 0; i < wbars.length; i++) {
      const v = wbars[i], h = 6 + v * 58
      c.fillStyle = v < 0.5 ? '#41d18a' : v < 0.8 ? '#f0a020' : '#e8511e'
      c.fillRect(i * bw + 6, baseY - h / 2, bw - 8, h)
    }
    lcdTex.needsUpdate = true
  }

  // ---- hover tilt ----
  const baseRX = 0.04, baseRY = -0.1
  let targetRX = 0, targetRY = 0
  function onMove(e) {
    const r = container.getBoundingClientRect()
    targetRY = (((e.clientX - r.left) / r.width) * 2 - 1) * 0.5
    targetRX = (((e.clientY - r.top) / r.height) * 2 - 1) * 0.32
  }
  function onLeave() { targetRX = 0; targetRY = 0 }
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerleave', onLeave)

  // ---- raycast buttons ----
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const pressOffset = new Map()
  function pressAnim(name) {
    pressables.filter((m) => m.name === name).forEach((m) => {
      if (pressOffset.has(m)) return
      pressOffset.set(m, m.position.z)
      m.position.z -= 0.1
      setTimeout(() => { m.position.z = pressOffset.get(m); pressOffset.delete(m) }, 130)
    })
  }
  function onDown(e) {
    const r = container.getBoundingClientRect()
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1
    ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(pressables, false)[0]
    if (!hit) return
    const name = hit.object.name
    pressAnim(name)
    if (name === 'prev') onPrev()
    else if (name === 'play') onPlayToggle()
    else if (name === 'next') onNext()
  }
  container.addEventListener('pointerdown', onDown)

  // ---- resize ----
  function resize() {
    const r = container.getBoundingClientRect()
    if (!r.width) return
    renderer.setSize(r.width, r.height, false)
    camera.aspect = r.width / r.height
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // ---- loop ----
  let raf = 0
  let running = false
  let waveFrame = 0
  function tick() {
    raf = requestAnimationFrame(tick)
    tt += 0.016
    group.rotation.x += (baseRX + targetRX - group.rotation.x) * 0.08
    group.rotation.y += (baseRY + targetRY - group.rotation.y) * 0.08
    if (!reduce) { group.position.y = Math.sin(tt * 1.2) * 0.05; group.rotation.z = Math.sin(tt * 0.6) * 0.012 }
    if (waveFrame++ % 3 === 0) { // slower, calmer wave
      for (let i = wbars.length - 1; i > 0; i--) wbars[i] = wbars[i - 1]
      const beat = 0.4 + 0.6 * Math.pow(Math.abs(Math.sin(tt * 0.9)), 1.5)
      wbars[0] = playing ? Math.min(1, (0.3 + 0.7 * Math.random()) * beat) : Math.max(0.05, wbars[0] - 0.05)
    }
    drawLCD()
    renderer.render(scene, camera)
  }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(tick) } }
  function stop() { running = false; cancelAnimationFrame(raf) }

  return {
    setLocation(loc) { placeText = loc.name; metaText = loc.coord },
    setPlaying(b) { playing = b; playTri.visible = !b; pauseL.visible = pauseR.visible = b },
    show() { container.classList.add('is-on'); resize(); start() },
    hide() { container.classList.remove('is-on'); stop() },
    dispose() {
      stop()
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}
