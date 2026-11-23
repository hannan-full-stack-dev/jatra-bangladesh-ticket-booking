import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { divisionName, placeById } from '@/data/cities'
import { projectPoint } from '@/lib/geo'
import { locate, upazilaShape } from '@/lib/mapGeo'
import { useUpazilaMap } from '@/hooks/useUpazilaMap'

const overlaps = (a, b) => a[0] < b.x + b.w && a[2] > b.x && a[1] < b.y + b.h && a[3] > b.y

/** The district a place is in, every upazila drawn, and the neighbours around it, cropped to the district. */
function frameOf(place, upa) {
  const { district, upazila } = locate(place, upa)
  const ids = Object.keys(upa.UPAZILAS)
  const members = ids.filter((id) => upa.UPAZILAS[id][0] === district)
  const box = [Infinity, Infinity, -Infinity, -Infinity]
  for (const id of members) {
    const b = upazilaShape(id, upa).box
    box[0] = Math.min(box[0], b[0]); box[1] = Math.min(box[1], b[1]); box[2] = Math.max(box[2], b[2]); box[3] = Math.max(box[3], b[3])
  }
  const pad = Math.max(box[2] - box[0], box[3] - box[1]) * 0.1
  const view = { x: box[0] - pad, y: box[1] - pad, w: box[2] - box[0] + 2 * pad, h: box[3] - box[1] + 2 * pad }
  const neighbours = ids.filter((id) => upa.UPAZILAS[id][0] !== district && overlaps(upazilaShape(id, upa).box, view))
  const p = projectPoint(place.lng, place.lat)
  return { district, upazila, members, neighbours, view, point: { x: p.x * upa.SCALE, y: p.y * upa.SCALE } }
}

/**
 * A close-up of one place on the map. The district it is in is shown with all its upazilas, and the place itself is
 * lit up: the whole district for a district, the single upazila for an upazila, the upazila around a station.
 */
export default function PlaceZoom({ place, role }) {
  const upa = useUpazilaMap()
  const frame = useMemo(() => (upa ? frameOf(place, upa) : null), [place, upa])
  const districtName = frame ? placeById(frame.district)?.name : null
  const isDistrict = place.kind === 'district'

  const where = isDistrict
    ? `District in ${divisionName(place.division)}${frame ? `, ${frame.members.length} upazilas` : ''}`
    : place.kind === 'station'
      ? `Railway station${districtName ? `, in ${districtName} district` : ''}`
      : districtName ? `Upazila in ${districtName} district` : `Upazila in ${divisionName(place.division)}`

  return (
    <figure className="min-w-0 rounded-2xl bg-ivory/[.06] p-3">
      {frame ? (
        <motion.svg key={place.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          viewBox={`${frame.view.x} ${frame.view.y} ${frame.view.w} ${frame.view.h}`} className="block h-32 w-full" role="img"
          aria-label={`${place.name}, shown inside ${districtName ?? 'its district'}`}>
          <g fill="rgba(246,241,231,.04)" stroke="rgba(246,241,231,.18)" strokeWidth=".6" strokeLinejoin="round">
            {frame.neighbours.map((id) => <path key={id} d={upa.UPAZILAS[id][1]} vectorEffect="non-scaling-stroke" />)}
          </g>
          <g stroke="rgba(246,241,231,.5)" strokeWidth=".7" strokeLinejoin="round">
            {frame.members.map((id) => (
              <path key={id} d={upa.UPAZILAS[id][1]} vectorEffect="non-scaling-stroke"
                fill={isDistrict ? 'rgba(200,162,74,.38)' : id === frame.upazila ? 'rgba(200,162,74,.92)' : 'rgba(246,241,231,.1)'} />
            ))}
          </g>
          <circle cx={frame.point.x} cy={frame.point.y} r={Math.max(frame.view.w, frame.view.h) * 0.028} fill="#F6F1E7" stroke="#0A2A20" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </motion.svg>
      ) : (
        <div className="h-32 rounded-xl bg-ivory/[.05]" aria-hidden="true" />
      )}
      <figcaption className="mt-2">
        <p className="text-xs text-ivory/60">{role}</p>
        <p className="truncate font-display text-lg leading-tight">{place.name}</p>
        <p className="text-xs text-ivory/60">{where}</p>
      </figcaption>
    </figure>
  )
}
