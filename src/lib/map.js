import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CITIES } from '../data/cities.js'

// Mapbox public token — read from env (set VITE_MAPBOX_TOKEN in .env.local / your host).
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const STYLE = 'mapbox://styles/cabbageblame/cmqbshc4d004401s4btbqcjzw'

if (!TOKEN) console.warn('[flaneur] VITE_MAPBOX_TOKEN is not set — the hero map will not load.')

export function initMap(container) {
  mapboxgl.accessToken = TOKEN
  const map = new mapboxgl.Map({
    container,
    style: STYLE,
    center: CITIES[0].center,
    zoom: CITIES[0].zoom,
    interactive: false,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    fadeDuration: 0,
  })
  map.on('load', () => map.resize())
  requestAnimationFrame(() => map.resize())
  return map
}

export function flyToCity(map, city) {
  map.flyTo({ center: city.center, zoom: city.zoom, duration: 2600, curve: 1.5, essential: true })
}
