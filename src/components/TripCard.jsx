import { motion } from 'framer-motion'
import { BedDouble, Plug, Snowflake, Wifi } from 'lucide-react'
import Button from './Button'
import { totalSeats } from '@/data/trips'
import { formatClock, formatDuration, formatMoney } from '@/lib/format'

const AMENITIES = { ac: [Snowflake, 'Air conditioned'], wifi: [Wifi, 'Wi-Fi'], charge: [Plug, 'Charging port'], recline: [BedDouble, 'Reclining seats'] }

/** The golden glow follows the pointer across the card. */
export default function TripCard({ trip, onSelect }) {
  const share = trip.seatsLeft / totalSeats(trip)
  const scarce = trip.seatsLeft <= 12

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-line bg-paper p-5 shadow-lift transition-colors hover:border-brass/60">
      <div className="relative grid items-center gap-5 md:grid-cols-[1.1fr_1.6fr_1fr]">
        <div>
          <h2 className="font-display text-xl">{trip.operator}</h2>
          <p className="mt-1 inline-flex rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">{trip.cls}</p>
          <ul className="mt-3 flex gap-2.5 text-mute" aria-label="Amenities">
            {trip.amenities.map((a) => {
              const [Icon, label] = AMENITIES[a]
              return <li key={a} title={label}><Icon className="h-4 w-4" aria-label={label} /></li>
            })}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="font-display text-3xl tabular-nums">{formatClock(trip.departMin)}</p>
            <p className="text-xs text-mute">Departs</p>
          </div>
          <div className="flex-1 text-center text-xs text-mute">
            <p>{formatDuration(trip.durationMin)}</p>
            <div className="relative my-1.5 h-px bg-line" aria-hidden="true">
              <motion.span className="absolute inset-0 origin-left bg-brass" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              <span className="absolute -left-0.5 -top-[3px] h-[7px] w-[7px] rounded-full bg-forest" />
              <span className="absolute -right-0.5 -top-[3px] h-[7px] w-[7px] rounded-full bg-forest" />
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl tabular-nums">{formatClock(trip.arriveMin)}</p>
            <p className="text-xs text-mute">{trip.arriveMin >= 1440 ? 'Arrives next day' : 'Arrives'}</p>
          </div>
        </div>

        <div className="md:text-right">
          <p className="font-display text-3xl tabular-nums">{formatMoney(trip.pricePerSeat)}</p>
          <p className="text-xs text-mute">per seat</p>
          <div className="my-3 h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${trip.seatsLeft} seats left`}>
            <motion.div className={`h-full rounded-full ${scarce ? 'bg-danger' : 'bg-forest-light'}`}
              initial={{ width: 0 }} animate={{ width: `${Math.max(share * 100, 4)}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <p className={`mb-3 text-xs font-medium ${scarce ? 'text-danger' : 'text-mute'}`}>{trip.seatsLeft} seats left</p>
          <Button className="w-full md:w-auto" onClick={onSelect}>Select seats</Button>
        </div>
      </div>
    </article>
  )
}
