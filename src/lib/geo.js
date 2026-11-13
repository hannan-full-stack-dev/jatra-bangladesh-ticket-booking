const EARTH_KM = 6371
const rad = (deg) => (deg * Math.PI) / 180

/** Road distance, estimated as straight-line distance x 1.25. */
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * EARTH_KM * Math.asin(Math.sqrt(h)) * 1.25)
}

/** Map frame. The height follows the real shape of the country (one degree of longitude is about 0.92 of a degree of latitude here). */
export const MAP = { width: 340, height: 484, lng: [87.95, 92.75], lat: [20.45, 26.7] }

/** Latitude/longitude to a point inside the SVG map. */
export function projectPoint(lng, lat) {
  return {
    x: ((lng - MAP.lng[0]) / (MAP.lng[1] - MAP.lng[0])) * MAP.width,
    y: ((MAP.lat[1] - lat) / (MAP.lat[1] - MAP.lat[0])) * MAP.height,
  }
}

export const project = (place) => projectPoint(place.lng, place.lat)

/**
 * Simplified outline of Bangladesh as [lng, lat] points, clockwise from the north-west tip.
 * Hand-traced for a stylised map, so it is accurate to a few kilometres, not a survey.
 */
export const BANGLADESH_OUTLINE = [
  [88.45, 26.63], [88.62, 26.46], [88.80, 26.36], [89.05, 26.30], [89.30, 26.21], [89.60, 26.22], [89.78, 26.05], [89.82, 25.80], [89.85, 25.50],
  [89.90, 25.28], [90.10, 25.18], [90.40, 25.15], [90.65, 25.17], [91.00, 25.16], [91.40, 25.19], [91.65, 25.14], [91.95, 25.18], [92.12, 25.10],
  [92.25, 24.95], [92.22, 24.75], [92.05, 24.45], [91.95, 24.30], [91.85, 24.18], [91.65, 24.05], [91.40, 24.02], [91.22, 23.88], [91.28, 23.65],
  [91.34, 23.40], [91.45, 23.20], [91.55, 23.05], [91.68, 23.15], [91.80, 23.45], [92.05, 23.68], [92.25, 23.40], [92.35, 23.00], [92.45, 22.65],
  [92.50, 22.35], [92.62, 22.00], [92.68, 21.80], [92.55, 21.55], [92.40, 21.35], [92.35, 21.10], [92.33, 20.85], [92.34, 20.60], [92.26, 20.62],
  [92.22, 20.85], [92.12, 21.12], [92.03, 21.30], [91.97, 21.50], [91.88, 21.85], [91.85, 22.20], [91.75, 22.42], [91.60, 22.65], [91.45, 22.85],
  [91.20, 22.75], [91.05, 22.55], [91.02, 22.35], [90.85, 22.15], [90.70, 21.95], [90.50, 21.84], [90.30, 21.80], [90.10, 21.80], [89.90, 21.82],
  [89.70, 21.80], [89.50, 21.78], [89.30, 21.68], [89.10, 21.65], [89.03, 21.82], [88.98, 22.05], [89.05, 22.30], [88.92, 22.50], [88.90, 22.80],
  [88.88, 23.05], [88.76, 23.35], [88.80, 23.55], [88.62, 23.85], [88.60, 24.05], [88.35, 24.30], [88.12, 24.55], [88.02, 24.75], [88.25, 25.00],
  [88.35, 25.25], [88.45, 25.65], [88.20, 26.05], [88.30, 26.40],
]

/** The outline as a softly rounded SVG path: curves run between the midpoints of each side, with the real points as corners' handles. */
function smoothClosedPath(points) {
  const pts = points.map(([lng, lat]) => projectPoint(lng, lat))
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const f = (n) => n.toFixed(1)
  const start = mid(pts[pts.length - 1], pts[0])
  let d = `M${f(start.x)} ${f(start.y)}`
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % pts.length])
    d += ` Q${f(p.x)} ${f(p.y)} ${f(m.x)} ${f(m.y)}`
  })
  return `${d} Z`
}

export const OUTLINE_PATH = smoothClosedPath(BANGLADESH_OUTLINE)
