import { MAP } from '@/data/bangladeshMap'

const EARTH_KM = 6371
const rad = (deg) => (deg * Math.PI) / 180

/** Road distance, estimated as straight-line distance x 1.25. */
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * EARTH_KM * Math.asin(Math.sqrt(h)) * 1.25)
}

export { MAP }

/** Latitude/longitude to a point inside the SVG map. Uses the same frame the division paths were drawn in. */
export function projectPoint(lng, lat) {
  return {
    x: ((lng - MAP.lng[0]) / (MAP.lng[1] - MAP.lng[0])) * MAP.width,
    y: ((MAP.lat[1] - lat) / (MAP.lat[1] - MAP.lat[0])) * MAP.height,
  }
}

export const project = (place) => projectPoint(place.lng, place.lat)
