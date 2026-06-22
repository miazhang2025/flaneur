import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * Loads the modelled walkman (public/walkman.glb) and styles it to the Flâneur UI.
 * The body gets a reflective metal-ish material (env-mapped); the recessed green
 * LCD is driven by a live canvas overlay (place name, coords, waveform). Hover
 * tilts it toward the cursor; the Prev / Play·Pause / Next nodes raycast to the
 * supplied handlers.
 *
 * The GLB loads asynchronously, but this returns synchronously with the usual
 * API — state set before the model is ready is queued and applied on load.
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

  // ---- environment (drives reflections on the body) ----
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex

  // ---- thin-film interference shader (oil-slick / anodised sheen on the body) ----
  // Two-beam interference: light reflecting off the top and bottom of a thin
  // film travels an extra optical path (2·n·d·cosθ); per-wavelength it constructively
  // or destructively interferes, so the reflected hue shifts with the view angle.
  const thinFilm = {
    thickness: { value: 360.0 }, // film thickness in nm
    ior: { value: 1.5 },         // film refractive index
    strength: { value: 1.2 },    // how strongly the iridescence tints the surface
  }
  function applyThinFilm(material) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTFThickness = thinFilm.thickness
      shader.uniforms.uTFIor = thinFilm.ior
      shader.uniforms.uTFStrength = thinFilm.strength
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', /* glsl */`#include <common>
          uniform float uTFThickness;
          uniform float uTFIor;
          uniform float uTFStrength;
          // reflected interference colour for a viewing cosine (n·v)
          vec3 thinFilmInterference(float cosTheta) {
            // refraction into the film (Snell), then optical path difference in nm
            float sinT2 = (1.0 - cosTheta * cosTheta) / (uTFIor * uTFIor);
            float cosT = sqrt(max(0.0, 1.0 - sinT2));
            float opd = 2.0 * uTFIor * uTFThickness * cosT;
            // sample three wavelengths; +PI is the hard-reflection phase shift
            vec3 lambda = vec3(650.0, 550.0, 450.0);
            vec3 phase = 6.2831853 * opd / lambda + 3.1415926;
            return 0.5 + 0.5 * cos(phase);
          }
        `)
        .replace('#include <opaque_fragment>', /* glsl */`#include <opaque_fragment>
          {
            vec3 tfV = normalize(vViewPosition);
            float tfCos = clamp(dot(normalize(normal), tfV), 0.0, 1.0);
            // edge-weighted sheen (a touch broader than before for more coverage)
            float tfFres = pow(1.0 - tfCos, 3.0);
            vec3 tfIri = thinFilmInterference(tfCos);
            // bias toward violet / purple (a little softer — some green left in)
            vec3 tfTint = vec3(0.72, 0.32, 1.0);
            tfIri = (tfIri * 0.45 + 0.55) * tfTint;
            gl_FragColor.rgb += tfIri * tfFres * uTFStrength;
          }
        `)
    }
    material.customProgramCacheKey = () => 'walkman-thinfilm'
    material.needsUpdate = true
  }

  // ---- per-neighbourhood light colour (matches the section background video) ----
  const lightColors = {
    chinatown: 0xFFB69C,  // red
    les: 0x95B9FD,        // blue
    soho: 0xffffff,       // white
    greenwich: 0xFDE895,  // orange
    harlem: 0xBFFBDD5,     // light purple
  }
  const targetLight = new THREE.Color(lightColors.chinatown)

  // ---- lights (dim; all carry the neighbourhood colour so it reads as a wash) ----
  const amb = new THREE.AmbientLight(0xffffff, 0.4); amb.color.copy(targetLight); scene.add(amb)
  const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(-5, 7, 6); key.color.copy(targetLight); scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.25); fill.position.set(6, -2, 4); fill.color.copy(targetLight); scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.45); rim.position.set(0, 2, -7); rim.color.copy(targetLight); scene.add(rim)

  const group = new THREE.Group()
  group.rotation.set(0.04, -0.1, 0)
  scene.add(group)

  // ---- LCD canvas (rendered onto an overlay plane once the model loads) ----
  const lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 512; lcdCanvas.height = 280
  const lcdTex = new THREE.CanvasTexture(lcdCanvas); lcdTex.colorSpace = THREE.SRGBColorSpace

  // ---- runtime state (queued until the model is ready) ----
  let placeText = 'Chinatown'
  let metaText = '40.715°N 73.997°W'
  let playing = false
  let tt = 0
  const wbars = new Array(24).fill(0.1)
  const MONO = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || '"SF Mono", ui-monospace, monospace'

  // nodes filled in on load
  let model = null
  let playNode = null
  let pauseNode = null
  const pressables = [] // meshes raycast for button hits
  const pressOffset = new Map()

  // ---- load the GLB ----
  const loader = new GLTFLoader()
  loader.load(
    `${import.meta.env.BASE_URL || '/'}walkman.glb`,
    (gltf) => onModelLoaded(gltf.scene),
    undefined,
    (err) => console.error('[walkman] failed to load walkman.glb', err),
  )

  function onModelLoaded(root) {
    model = root
    // front of the device (buttons + screen) is +X in the model; face it at the camera (+Z)
    model.rotation.y = -Math.PI / 2
    group.add(model)

    // center + scale to fit (target height ~ the old procedural body)
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = 4.7 / size.y
    model.scale.setScalar(s)
    model.position.set(-center.x * s, -center.y * s, -center.z * s)

    // index nodes by name
    const byName = {}
    model.traverse((o) => { if (o.name) byName[o.name] = o })

    // give every part the same glossy/reflective treatment + thin-film sheen,
    // each keeping its own base colour. materials are shared between meshes, so
    // cache by source material and upgrade each one only once.
    const matCache = new Map()
    const upgrade = (src) => {
      if (matCache.has(src)) return matCache.get(src)
      const m = new THREE.MeshPhysicalMaterial({
        color: src.color, // unchanged base colour
        map: src.map || null,
        emissive: src.emissive || 0x000000,
        emissiveMap: src.emissiveMap || null,
        transparent: src.transparent,
        opacity: src.opacity,
        metalness: 0.4,
        roughness: 0.3,
        envMap: envTex,
        envMapIntensity: 0.25,
      })
      applyThinFilm(m) // custom oil-slick / anodised iridescence (grazing-edge sheen)
      matCache.set(src, m)
      return m
    }
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = Array.isArray(o.material) ? o.material.map(upgrade) : upgrade(o.material)
      }
    })

    // buttons → raycast actions (Play and Pause share the 'play' action)
    const tag = (node, action) => {
      if (!node) return
      node.userData.wkAction = action
      pressables.push(node)
    }
    tag(byName['Prev'], 'prev')
    tag(byName['Next'], 'next')
    playNode = byName['Play']; pauseNode = byName['Pause']
    tag(playNode, 'play'); tag(pauseNode, 'play')

    // LCD overlay over the screen recess (model-local: front face +X, upper area)
    // screen slab spans y≈0.41..1.37, z≈-0.73..0.73, front at x≈0.17
    const lcdGeo = new THREE.PlaneGeometry(1.4, 0.92)
    const lcdMat = new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false })
    const lcdMesh = new THREE.Mesh(lcdGeo, lcdMat)
    lcdMesh.position.set(0.185, 0.89, 0)
    lcdMesh.rotation.y = Math.PI / 2 // face +X; plane local X → -Z so width runs along Z
    model.add(lcdMesh)

    // apply any state set before load finished
    setPlayingMeshes(playing)
    drawLCD()
  }

  function setPlayingMeshes(b) {
    if (playNode) playNode.visible = !b
    if (pauseNode) pauseNode.visible = b
  }

  // ---- LCD drawing ----
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
  function pressAnim(action) {
    pressables.filter((m) => m.userData.wkAction === action && m.visible).forEach((m) => {
      if (pressOffset.has(m)) return
      pressOffset.set(m, m.position.x) // front axis is local +X
      m.position.x -= 0.06
      setTimeout(() => { m.position.x = pressOffset.get(m); pressOffset.delete(m) }, 130)
    })
  }
  function onDown(e) {
    if (!pressables.length) return
    const r = container.getBoundingClientRect()
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1
    ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(pressables, true)[0]
    if (!hit) return
    let o = hit.object
    while (o && o.userData.wkAction === undefined) o = o.parent
    const action = o && o.userData.wkAction
    if (!action) return
    pressAnim(action)
    if (action === 'prev') onPrev()
    else if (action === 'play') onPlayToggle()
    else if (action === 'next') onNext()
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
    // ease the lights toward the active neighbourhood colour
    amb.color.lerp(targetLight, 0.05)
    key.color.lerp(targetLight, 0.05)
    fill.color.lerp(targetLight, 0.05)
    rim.color.lerp(targetLight, 0.05)
    if (!reduce) { group.position.y = Math.sin(tt * 1.2) * 0.05; group.rotation.z = Math.sin(tt * 0.6) * 0.012 }
    if (waveFrame++ % 3 === 0) { // slower, calmer wave
      for (let i = wbars.length - 1; i > 0; i--) wbars[i] = wbars[i - 1]
      const beat = 0.4 + 0.6 * Math.pow(Math.abs(Math.sin(tt * 0.9)), 1.5)
      wbars[0] = playing ? Math.min(1, (0.3 + 0.7 * Math.random()) * beat) : Math.max(0.05, wbars[0] - 0.05)
    }
    if (model) drawLCD()
    renderer.render(scene, camera)
  }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(tick) } }
  function stop() { running = false; cancelAnimationFrame(raf) }

  return {
    setLocation(loc) {
      placeText = loc.name; metaText = loc.coord
      if (loc.id && lightColors[loc.id] !== undefined) targetLight.set(lightColors[loc.id])
    },
    setPlaying(b) { playing = b; setPlayingMeshes(b) },
    show() { container.classList.add('is-on'); resize(); start() },
    hide() { container.classList.remove('is-on'); stop() },
    dispose() {
      stop()
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', resize)
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
