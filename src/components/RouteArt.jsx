import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { DIVISIONS, placeById, placesFor } from '@/data/cities'
import { DIVISION_PATHS } from '@/data/bangladeshMap'
import { MAP, project, projectPoint } from '@/lib/geo'

const quad = (t, a, c, b) => (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t ** 2 * b

/**
 * All of Bangladesh with the name of every division. The cities you pick get a dot that pulses,
 * the route between them draws itself, and a vehicle travels along it.
 */
export default function RouteArt({ from, to, mode }) {
  const reduce = useReducedMotion()
  const fromCity = placeById(from)
  const toCity = placeById(to)
  const a = project(fromCity)
  const b = project(toCity)
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  // Control point pushed sideways from the midpoint so the route arcs.
  const c = { x: (a.x + b.x) / 2 - ((b.y - a.y) / length) * length * 0.22, y: (a.y + b.y) / 2 + ((b.x - a.x) / length) * length * 0.22 }
  const path = `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`

  const x = useMotionValue(a.x)
  const y = useMotionValue(a.y)
  const geometry = useRef()
  geometry.current = { a, b, c }
  useAnimationFrame((time) => {
    if (reduce) return
    const k = (time % 3400) / 3400
    const eased = k * k * (3 - 2 * k)
    const { a: p0, b: p1, c: ctrl } = geometry.current
    x.set(quad(eased, p0.x, ctrl.x, p1.x))
    y.set(quad(eased, p0.y, ctrl.y, p1.y))
  })

  const activeDivisions = new Set([fromCity.division, toCity.division])

  return (
    <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} className="relative mx-auto block w-full max-w-[370px] overflow-visible" role="img"
      aria-label={`Map of Bangladesh. Route from ${fromCity.name} to ${toCity.name}`}>
      {/* The country. A wide stroke underneath, then the divisions on top, leaves a clean outer edge. */}
      <g stroke="rgba(246,241,231,.55)" strokeWidth="2.4" strokeLinejoin="round" fill="none">
        {DIVISIONS.map((d) => <path key={d.id} d={DIVISION_PATHS[d.id]} />)}
      </g>
      <g strokeLinejoin="round" stroke="rgba(246,241,231,.22)" strokeWidth=".8" fill="rgb(24,66,52)">
        {DIVISIONS.map((d) => <path key={d.id} d={DIVISION_PATHS[d.id]} />)}
      </g>
      {/* The divisions you are travelling between get a light brass tint. */}
      <g fill="rgba(200,162,74,.18)" stroke="none">
        {DIVISIONS.filter((d) => activeDivisions.has(d.id)).map((d) => <path key={d.id} d={DIVISION_PATHS[d.id]} />)}
      </g>

      {/* Division names. The divisions you are travelling between are brighter. */}
      {DIVISIONS.map((d) => {
        const p = projectPoint(d.label.lng, d.label.lat)
        const active = activeDivisions.has(d.id)
        return (
          <text key={d.id} x={p.x} y={p.y} textAnchor="middle" fontSize="10.5" fontWeight="500"
            fill={active ? 'rgba(232,206,140,1)' : 'rgba(246,241,231,.5)'} style={{ transition: 'fill .3s' }}>
            {d.name}
          </text>
        )
      })}

      <path d={path} fill="none" stroke="rgba(246,241,231,.18)" strokeWidth="2" strokeDasharray="3 6" />
      <motion.path key={`${from}-${to}`} d={path} fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />

      {/* In train mode every station that has a train is a small dot, so the rail network shows. */}
      {mode === 'train' && (
        <g fill="rgba(246,241,231,.4)">
          {placesFor('train').map((st) => { const p = project(st); return <circle key={st.id} cx={p.x} cy={p.y} r="1.3" /> })}
        </g>
      )}

      {/* The two places you picked sit on top of the route so their names stay readable. */}
      {[fromCity, toCity].map((place) => {
        const p = project(place)
        const labelLeft = p.x > MAP.width * 0.55
        return (
          <g key={place.id}>
            <circle cx={p.x} cy={p.y} r="5" fill="#F6F1E7" />
            {!reduce && (
              <motion.circle key={`${from}-${to}`} cx={p.x} cy={p.y} fill="none" stroke="#C8A24A" strokeWidth="1.5"
                initial={{ r: 5, opacity: 0.9 }} animate={{ r: 18, opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
            )}
            <text x={p.x + (labelLeft ? -10 : 10)} y={p.y + 5} textAnchor={labelLeft ? 'end' : 'start'} className="font-display" fontSize="14" fill="#F6F1E7"
              stroke="#0A2A20" strokeWidth="3" paintOrder="stroke">
              {place.name}
            </text>
          </g>
        )
      })}

      {!reduce && <motion.circle cx={x} cy={y} r="5" fill="#C8A24A" stroke="#0A2A20" strokeWidth="2" />}
    </svg>
  )
}
