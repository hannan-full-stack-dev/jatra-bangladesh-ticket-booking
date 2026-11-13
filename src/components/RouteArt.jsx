import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { DIVISIONS, PLACES, placeById } from '@/data/cities'
import { DIVISION_PATHS, DIVISION_LABELS } from '@/data/divisionPaths'
import { firstTrainBetween, trainPath } from '@/data/operators'
import { MAP, project } from '@/lib/geo'

/** Solid fills (no outlines): neighbouring divisions differ in tone, so every border is the real one. */
const TONES = {
  rangpur: '#2E6B58', rajshahi: '#3F7F69', mymensingh: '#265E4D', sylhet: '#3A766F',
  dhaka: '#4B8C74', khulna: '#2A6454', barishal: '#3C7A63', chattogram: '#33705F',
}

const quad = (t, a, c, b) => (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t ** 2 * b

/** Width of a division name in map units: capital letters at 10px, semibold, 1.2 spacing is about 8.4 per letter. */
const labelWidth = (name, size) => name.length * 8.4 * (size / 10)

/** The line a vehicle follows. A train uses its real stops; a bus has no road data, so it follows a gentle arc between the two places. */
function buildRoute(mode, from, to) {
  const a = project(placeById(from))
  const b = project(placeById(to))
  if (mode === 'train') {
    const found = firstTrainBetween(from, to)
    if (found) {
      const points = trainPath(found).map((id) => project(placeById(id)))
      return { points, d: points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '), stops: points.slice(1, -1) }
    }
  }
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const c = { x: (a.x + b.x) / 2 - ((b.y - a.y) / length) * length * 0.22, y: (a.y + b.y) / 2 + ((b.x - a.x) / length) * length * 0.22 }
  const points = Array.from({ length: 41 }, (_, i) => ({ x: quad(i / 40, a.x, c.x, b.x), y: quad(i / 40, a.y, c.y, b.y) }))
  return { points, d: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`, stops: [] }
}

/** The point `t` (0 to 1) of the way along a line of points, measured by distance. */
function pointAlong(points, t) {
  let total = 0
  const lengths = points.slice(1).map((p, i) => { const l = Math.hypot(p.x - points[i].x, p.y - points[i].y); total += l; return l })
  let left = t * total
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] ? Math.min(1, left / lengths[i]) : 0
      return { x: points[i].x + (points[i + 1].x - points[i].x) * k, y: points[i].y + (points[i + 1].y - points[i].y) * k }
    }
    left -= lengths[i]
  }
  return points[0]
}

/**
 * All of Bangladesh drawn from its real division boundaries, with the name of every division. The place you leave and the place
 * you go to sit at their real coordinates (the destination is the one gold dot), the line between them draws itself, and a vehicle travels along it.
 * By train the line runs through the real stops of the first direct train; by bus it is an arc, because roads are not in the data.
 */
export default function RouteArt({ from, to, mode }) {
  const reduce = useReducedMotion()
  const fromCity = placeById(from)
  const toCity = placeById(to)
  const a = project(fromCity)
  const b = project(toCity)
  const route = useMemo(() => buildRoute(mode, from, to), [mode, from, to])

  const x = useMotionValue(a.x)
  const y = useMotionValue(a.y)
  const points = useRef(route.points)
  points.current = route.points
  const vehicleOpacity = useMotionValue(0)
  useAnimationFrame((time) => {
    if (reduce) return
    const k = (time % 3400) / 3400
    vehicleOpacity.set(Math.min(1, k * 8, (1 - k) * 8))
    const at = pointAlong(points.current, k * k * (3 - 2 * k))
    x.set(at.x)
    y.set(at.y)
  })

  const activeDivisions = new Set([fromCity.div, toCity.div])

  // The two names would sit on top of each other when the places are close: the origin goes above its dot, the destination below.
  const crowded = Math.abs(a.y - b.y) < 16 && Math.abs(a.x - b.x) < 100
  const pins = [
    { id: from, place: fromCity, p: a, origin: true, dy: crowded ? -9 : 5 },
    { id: to, place: toCity, p: b, origin: false, dy: crowded ? 17 : 5 },
  ]

  return (
    <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} className="relative mx-auto block w-full max-w-[370px]" role="img"
      aria-label={`Map of Bangladesh. Route from ${fromCity.name} to ${toCity.name}`}>
      {/* The country, as its eight real divisions. A same-colour hairline only hides anti-aliasing seams between neighbours. */}
      {DIVISIONS.map((d, i) => (
        <motion.g key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: reduce ? 0 : i * 0.06 }}>
          <path d={DIVISION_PATHS[d.id]} fill={TONES[d.id]} stroke={TONES[d.id]} strokeWidth="0.5" strokeLinejoin="round" />
          <path d={DIVISION_PATHS[d.id]} fill="#C8A24A" style={{ opacity: activeDivisions.has(d.id) ? 0.28 : 0, transition: 'opacity .4s' }} />
        </motion.g>
      ))}

      {/* Division names. The divisions you are travelling between are brighter. A name steps aside when a picked place sits on it. */}
      {DIVISIONS.map((d) => {
        const p = DIVISION_LABELS[d.id]
        const half = labelWidth(d.name, p.size) / 2 + 9
        if ([a, b].some((pin) => Math.abs(pin.x - p.x) < half && pin.y > p.y - 18 && pin.y < p.y + 10)) return null
        return (
          <text key={d.id} x={p.x} y={p.y} textAnchor="middle" fontSize={p.size} fontWeight="600" letterSpacing={p.size * 0.12}
            fill={activeDivisions.has(d.id) ? 'rgba(255,236,190,.98)' : 'rgba(246,241,231,.6)'} style={{ transition: 'fill .4s', textTransform: 'uppercase' }}>
            {d.name}
          </text>
        )
      })}

      <path d={route.d} fill="none" stroke="rgba(246,241,231,.18)" strokeWidth="2" strokeDasharray="3 6" />
      <motion.path key={`${mode}-${from}-${to}`} d={route.d} fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />

      {/* Every station (train) or district (bus) as a faint dot, so the map reads like the real network. */}
      <g aria-hidden="true" fill="rgba(246,241,231,.4)">
        {(mode === 'train' ? PLACES.train : PLACES.bus.filter((p) => p.kind === 'district')).map((p) => {
          const { x: px, y: py } = project(p)
          return <circle key={p.id} cx={px} cy={py} r={mode === 'train' ? 1 : 1.5} />
        })}
      </g>

      {/* The real stops the train makes between the two stations. */}
      <g aria-hidden="true" fill="#F6F1E7" stroke="#0A2A20" strokeWidth="0.8">
        {route.stops.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" />)}
      </g>

      {/* The vehicle is cream, never gold: the only gold dot on the map is the destination. */}
      {!reduce && <motion.circle cx={x} cy={y} r="3.5" fill="#F6F1E7" stroke="#0A2A20" strokeWidth="1.5" style={{ opacity: vehicleOpacity }} />}

      {/* The two places you picked sit on top of the route so their names stay readable. */}
      {pins.map(({ id, place, p, origin, dy }) => {
        const labelLeft = p.x > MAP.width * 0.5
        const labelY = Math.min(Math.max(p.y + dy, 16), MAP.height - 8)
        const colour = origin ? '#F6F1E7' : '#C8A24A'
        return (
          <g key={`${origin}-${id}`}>
            {!reduce && (
              <motion.circle key={`pulse-${id}`} cx={p.x} cy={p.y} fill="none" stroke={colour} strokeWidth="1.5"
                initial={{ r: 5, opacity: 0.9 }} animate={{ r: 18, opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />
            )}
            <motion.circle key={`dot-${id}`} cx={p.x} cy={p.y} initial={{ r: 0 }} animate={{ r: 5.5 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              fill={colour} stroke="#0A2A20" strokeWidth="2" />
            <text x={p.x + (labelLeft ? -10 : 10)} y={labelY} textAnchor={labelLeft ? 'end' : 'start'} className="font-display" fontSize="15" fill="#F6F1E7"
              stroke="#0A2A20" strokeWidth="3" paintOrder="stroke">
              {place.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
