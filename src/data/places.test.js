import { describe, expect, it } from 'vitest'
import { distanceKm, projectPoint } from '../lib/geo'
import { PLACES } from './cities'
import { DIVISION_LABELS, DIVISION_PATHS } from './divisionPaths'
import { firstTrainBetween, trainPath } from './operators'
import { routeKm } from './trips'

/** [[x, y], ...] for each closed shape of a division path (the paths only use M, L and Z). */
const shapes = (d) => (d.match(/M[^M]*/g) ?? []).map((s) => (s.match(/[ML]\s*[\d.-]+ [\d.-]+/g) ?? []).map((t) => t.slice(1).trim().split(' ').map(Number)))
const SHAPES = Object.fromEntries(Object.entries(DIVISION_PATHS).map(([id, d]) => [id, shapes(d)]))

const inside = ([x, y], poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const edgeDistance = ([x, y], poly) => {
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]
    const dx = x1 - x0, dy = y1 - y0
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)))
    best = Math.min(best, Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)))
  }
  return best
}
/** 0 when the point is inside the division, otherwise how many map units it is outside. */
const outsideBy = (pt, div) => (SHAPES[div].some((poly) => inside(pt, poly)) ? 0 : Math.min(...SHAPES[div].map((poly) => edgeDistance(pt, poly))))

describe('the dot lands on the real place', () => {
  it('puts every place inside its own division on the map (borders are simplified, so 3 map units of slack)', () => {
    const off = [...PLACES.bus, ...PLACES.train].filter((p) => {
      const { x, y } = projectPoint(p.lng, p.lat)
      return outsideBy([x, y], p.div) > 3
    })
    expect(off.map((p) => `${p.id} ${p.name}`)).toEqual([])
  })
  it('keeps every upazila close to the district it says it belongs to', () => {
    const districts = new Map(PLACES.bus.filter((p) => p.kind === 'district').map((d) => [d.name, d]))
    const far = PLACES.bus.filter((p) => p.kind === 'upazila' && distanceKm(p, districts.get(p.sub.replace('Upazila · ', ''))) > 120 * 1.25)
    expect(far.map((p) => `${p.name} (${p.sub})`)).toEqual([])
  })
  it('gives every upazila name that is shared a district in brackets, and no two places the same name', () => {
    const names = PLACES.bus.map((p) => p.name)
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
  })
})

describe('division names', () => {
  const W = 8.4 // map units per capital letter at font-size 10 (semibold, letter-spacing 1.2)
  it('sit inside their own division', () => {
    for (const [id, { x, y, size }] of Object.entries(DIVISION_LABELS)) {
      const half = (id.length * W * (size / 10)) / 2
      for (const dx of [-half, 0, half]) expect(outsideBy([x + dx, y - 3], id), `${id} at ${dx}`).toBeLessThan(2)
    }
  })
  it('never touch each other (Khulna and Barishal used to)', () => {
    const boxes = Object.entries(DIVISION_LABELS).map(([id, { x, y, size }]) => ({ id, x0: x - (id.length * W * (size / 10)) / 2, x1: x + (id.length * W * (size / 10)) / 2, y0: y - 10, y1: y + 2 }))
    for (const a of boxes) for (const b of boxes) {
      if (a.id >= b.id) continue
      const overlap = a.x0 < b.x1 + 4 && b.x0 < a.x1 + 4 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4
      expect(overlap, `${a.id} / ${b.id}`).toBe(false)
    }
  })
})

describe('the route on the map', () => {
  it('runs along the first direct train, from the first station to the last', () => {
    const found = firstTrainBetween('sda', 'sctg')
    const path = trainPath(found)
    expect(path[0]).toBe('sda')
    expect(path.at(-1)).toBe('sctg')
    expect(path.length).toBeGreaterThan(2)
  })
  it('shows the same rail distance as the train timetable', () => {
    const { from, to } = firstTrainBetween('sda', 'sctg')
    expect(routeKm('train', 'sda', 'sctg')).toBe(Math.round(to[3] - from[3]))
  })
})
