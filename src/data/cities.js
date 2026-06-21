// Lightweight city data (no mapbox dependency) so the hero UI can render
// before the heavy map module loads.

export const CITIES = [
  { id: 'nyc', name: 'New York', center: [-73.9855, 40.7480], zoom: 10.7 },
  { id: 'pgh', name: 'Pittsburgh', center: [-79.9959, 40.4406], zoom: 11.0 },
  { id: 'paris', name: 'Paris', center: [2.3522, 48.8566], zoom: 11.0 },
  { id: 'shanghai', name: 'Shanghai', center: [121.4737, 31.2304], zoom: 10.6 },
]

// Pool the "More" pill flies to at random.
export const RANDOM_CITIES = [
  { name: 'Tokyo', center: [139.6917, 35.6895], zoom: 10.4 },
  { name: 'London', center: [-0.1276, 51.5072], zoom: 10.6 },
  { name: 'Berlin', center: [13.4050, 52.5200], zoom: 10.6 },
  { name: 'Mexico City', center: [-99.1332, 19.4326], zoom: 10.4 },
  { name: 'Istanbul', center: [28.9784, 41.0082], zoom: 10.5 },
  { name: 'Lisbon', center: [-9.1393, 38.7223], zoom: 11.0 },
  { name: 'Mumbai', center: [72.8777, 19.0760], zoom: 10.6 },
  { name: 'Cape Town', center: [18.4241, -33.9249], zoom: 10.6 },
  { name: 'Buenos Aires', center: [-58.3816, -34.6037], zoom: 10.6 },
  { name: 'Cairo', center: [31.2357, 30.0444], zoom: 10.6 },
]

export function randomCity(excludeName) {
  const pool = RANDOM_CITIES.filter((c) => c.name !== excludeName)
  return pool[Math.floor(Math.random() * pool.length)]
}
