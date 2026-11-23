import { DISTRICT_PATHS } from '@/data/bangladeshMap'
import { projectPoint } from '@/lib/geo'

/** Finding out where a place lies: which district, and which upazila. Pure functions, no React. */

const NUMBERS = /-?\d+(?:\.\d+)?/g

function inside(x, y, ring) {
  let ok = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[j]
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) ok = !ok
  }
  return ok
}

/** "M x y L x y ... Z M ..." (the district paths) to a list of rings of [x, y]. */
export function parseAbsolute(d) {
  return d.split('M').slice(1).map((segment) => {
    const n = segment.match(NUMBERS).map(Number)
    const ring = []
    for (let i = 0; i < n.length; i += 2) ring.push([n[i], n[i + 1]])
    return ring
  })
}

/** "M x y l dx dy dx dy ... z" (the upazila paths) to a list of rings of [x, y]. */
export function parseRelative(d) {
  return d.split('z').filter(Boolean).map((segment) => {
    const [first, rest = ''] = segment.slice(1).split('l')
    let [x, y] = first.trim().split(' ').map(Number)
    const n = rest.match(NUMBERS)?.map(Number) ?? []
    const ring = [[x, y]]
    for (let i = 0; i < n.length; i += 2) { x += n[i]; y += n[i + 1]; ring.push([x, y]) }
    return ring
  })
}

let districtRings
/** The district at a point of the main map. Just off the coast it takes the nearest one. */
export function districtAt(x, y) {
  districtRings ??= Object.entries(DISTRICT_PATHS).map(([id, d]) => [id, parseAbsolute(d)])
  for (const [id, rings] of districtRings) if (rings.some((r) => inside(x, y, r))) return id
  let best = null
  let bestDist = Infinity
  for (const [id, rings] of districtRings) {
    for (const r of rings) for (const [px, py] of r) {
      const dist = (px - x) ** 2 + (py - y) ** 2
      if (dist < bestDist) { bestDist = dist; best = id }
    }
  }
  return best
}

const shapes = new Map()
/** An upazila's rings and bounding box [x0, y0, x1, y1], in the big frame of upazilaMap.js. Parsed once. */
export function upazilaShape(id, upa) {
  let shape = shapes.get(id)
  if (!shape) {
    const rings = parseRelative(upa.UPAZILAS[id][1])
    const box = [Infinity, Infinity, -Infinity, -Infinity]
    for (const r of rings) for (const [x, y] of r) {
      box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y)
    }
    shape = { rings, box }
    shapes.set(id, shape)
  }
  return shape
}

/** The upazila at a point of the big frame, or null. */
export function upazilaAt(x, y, upa) {
  for (const id of Object.keys(upa.UPAZILAS)) {
    const { rings, box } = upazilaShape(id, upa)
    if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) continue
    if (rings.some((r) => inside(x, y, r))) return id
  }
  return null
}

/**
 * Which district, and which upazila, a place is in. `upa` is the loaded upazilaMap module. Without it the district is
 * still found, from the district outlines, and the upazila only for a place that is one.
 */
export function locate(place, upa) {
  if (place.kind === 'district') return { district: place.id, upazila: null }
  if (upa && place.kind === 'upazila' && upa.UPAZILAS[place.id]) return { district: upa.UPAZILAS[place.id][0], upazila: place.id }
  const { x, y } = projectPoint(place.lng, place.lat)
  if (upa) {
    const id = upazilaAt(x * upa.SCALE, y * upa.SCALE, upa)
    if (id) return { district: upa.UPAZILAS[id][0], upazila: id }
  }
  return { district: districtAt(x, y), upazila: place.kind === 'upazila' ? place.id : null }
}
