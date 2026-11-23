import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { DIVISIONS, placeById, placesFor } from '@/data/cities'
import { BORDERS, DISTRICT_LABELS, DISTRICT_PATHS } from '@/data/bangladeshMap'
import { useUpazilaMap } from '@/hooks/useUpazilaMap'
import { MAP, project, projectPoint } from '@/lib/geo'
import { locate } from '@/lib/mapGeo'

const quad = (t, a, c, b) => (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t ** 2 * b

/**
 * All of Bangladesh with its 64 districts and the name of every division. The places you pick light up (a district, or the
 * upazila inside its district), they get a dot that pulses, the route between them draws itself, and a vehicle travels along it.
 * Touch or hover a district to see its name.
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

  const upa = useUpazilaMap()
  const [hover, setHover] = useState(null)
  const [picked, setPicked] = useState(null)
  const spots = useMemo(() => [fromCity, toCity].map((place) => locate(place, upa)), [fromCity, toCity, upa])
  const strong = new Set()   // districts that were picked as districts
  const soft = new Set()     // districts that hold a picked upazila or station
  ;[fromCity, toCity].forEach((place, i) => (place.kind === 'district' ? strong : soft).add(spots[i].district))
  const districtKey = [...new Set(spots.map((s) => s.district))].sort().join()
  // Upazila outlines, only inside the districts you are travelling between.
  const detail = useMemo(() => (upa ? Object.values(upa.UPAZILAS).filter(([d]) => districtKey.split(',').includes(d)).map(([, p]) => p).join('') : ''), [upa, districtKey])
  const chosen = spots.map((s) => s.upazila).filter(Boolean)
  const shown = hover ?? picked
  const activeDivisions = new Set([fromCity.division, toCity.division])

  return (
    <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} className="relative mx-auto block w-full max-w-[370px] overflow-visible" role="img"
      aria-label={`Map of Bangladesh. Route from ${fromCity.name} to ${toCity.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) setPicked(null) }}>
      {/* The country. A wide stroke underneath, then the districts on top, leaves a clean outer edge. */}
      <path d={BORDERS.country} fill="none" stroke="rgba(246,241,231,.55)" strokeWidth="2.4" strokeLinejoin="round" pointerEvents="none" />
      <g fill="rgb(24,66,52)">
        {Object.keys(DISTRICT_PATHS).map((id) => (
          <path key={id} d={DISTRICT_PATHS[id]}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(id) }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(null) }}
            onClick={() => setPicked((cur) => (cur === id ? null : id))} />
        ))}
      </g>
      {/* The districts you are travelling between get a brass tint, stronger when you picked the district itself. */}
      <g stroke="none" pointerEvents="none">
        {[...soft].filter((id) => !strong.has(id)).map((id) => (
          <motion.path key={`soft-${id}`} d={DISTRICT_PATHS[id]} fill="rgba(200,162,74,.16)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        ))}
        {[...strong].map((id) => (
          <motion.path key={`strong-${id}`} d={DISTRICT_PATHS[id]} fill="rgba(200,162,74,.4)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        ))}
        {shown && <path d={DISTRICT_PATHS[shown]} fill="rgba(246,241,231,.1)" />}
      </g>
      {/* District borders, then the heavier borders between divisions. */}
      <g fill="none" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none">
        <path d={BORDERS.district} stroke="rgba(246,241,231,.17)" strokeWidth=".5" />
        <path d={BORDERS.division} stroke="rgba(246,241,231,.42)" strokeWidth=".9" />
      </g>
      {/* Every upazila of the districts you picked, and the picked upazila itself. */}
      {upa && detail && (
        <motion.g key={districtKey} pointerEvents="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <g transform={`scale(${1 / upa.SCALE})`} strokeLinejoin="round">
            <path d={detail} fill="none" stroke="rgba(246,241,231,.34)" strokeWidth=".5" vectorEffect="non-scaling-stroke" />
            {chosen.map((id) => <path key={id} d={upa.UPAZILAS[id][1]} fill="rgba(200,162,74,.9)" stroke="#E8CE8C" strokeWidth=".8" vectorEffect="non-scaling-stroke" />)}
          </g>
        </motion.g>
      )}

      {/* Division names. The divisions you are travelling between are brighter. */}
      {DIVISIONS.map((d) => {
        const p = projectPoint(d.label.lng, d.label.lat)
        const active = activeDivisions.has(d.id)
        return (
          <text key={d.id} x={p.x} y={p.y} textAnchor="middle" fontSize="10.5" fontWeight="500" pointerEvents="none"
            fill={active ? 'rgba(232,206,140,1)' : 'rgba(246,241,231,.5)'} style={{ transition: 'fill .3s' }}>
            {d.name}
          </text>
        )
      })}

      {shown && (
        <text x={DISTRICT_LABELS[shown][0]} y={DISTRICT_LABELS[shown][1]} textAnchor="middle" fontSize="10" fontWeight="600" fill="#F6F1E7"
          stroke="#0A2A20" strokeWidth="3" paintOrder="stroke" pointerEvents="none">{placeById(shown)?.name}</text>
      )}

      <g pointerEvents="none">
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
      </g>
    </svg>
  )
}
