import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, SearchX } from 'lucide-react'
import Button from '@/components/Button'
import SegmentedControl from '@/components/SegmentedControl'
import TripCard from '@/components/TripCard'
import { cityById } from '@/data/cities'
import { generateTrips } from '@/data/trips'
import { formatDate } from '@/lib/format'
import { selectTrips } from '@/lib/tripFilters'
import { useBooking } from '@/state/BookingContext'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Any time' }, { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' }, { value: 'night', label: 'Night' },
]
const SORT_OPTIONS = [
  { value: 'earliest', label: 'Earliest' }, { value: 'cheapest', label: 'Cheapest' }, { value: 'fastest', label: 'Fastest' },
]

function Skeleton() {
  return (
    <div className="relative h-40 overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-ivory to-transparent" />
    </div>
  )
}

export default function ResultsScreen() {
  const [{ mode, from, to, date }, dispatch] = useBooking()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [sort, setSort] = useState('earliest')

  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(id)
  }, [mode, from, to, date])

  const trips = useMemo(() => generateTrips({ mode, from, to, date }), [mode, from, to, date])
  const visible = useMemo(() => selectTrips(trips, { period, sort }), [trips, period, sort])

  return (
    <section aria-labelledby="results-title">
      <Button variant="ghost" className="mb-5 min-h-10 px-4 text-sm" onClick={() => dispatch({ type: 'GO', step: 'search' })}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Change search
      </Button>
      <h1 id="results-title" className="font-display text-4xl tracking-tight md:text-5xl">{cityById(from).name} → {cityById(to).name}</h1>
      <p className="mt-2 text-mute">{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} · {loading ? 'Searching…' : `${visible.length} of ${trips.length} trips`}</p>

      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Time of day" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} layoutId="period-pill" />
        <SegmentedControl label="Sort by" options={SORT_OPTIONS} value={sort} onChange={setSort} layoutId="sort-pill" />
      </div>

      {loading ? (
        <div className="grid gap-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} />)}</div>
      ) : trips.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-paper px-6 py-14 text-center">
          <SearchX className="mx-auto mb-3 h-8 w-8 text-mute" aria-hidden="true" />
          <p className="font-display text-2xl">No direct train on this route</p>
          <p className="mt-1 text-mute">No Bangladesh Railway train runs straight from {cityById(from).name} to {cityById(to).name}. Try a station tagged Direct, or swap the two.</p>
          <Button variant="ghost" className="mt-5" onClick={() => dispatch({ type: 'GO', step: 'search' })}>Change search</Button>
        </motion.div>
      ) : visible.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-paper px-6 py-14 text-center">
          <SearchX className="mx-auto mb-3 h-8 w-8 text-mute" aria-hidden="true" />
          <p className="font-display text-2xl">No trips at that time of day</p>
          <p className="mt-1 text-mute">Try another time of day.</p>
          <Button variant="ghost" className="mt-5" onClick={() => setPeriod('all')}>Show all trips</Button>
        </motion.div>
      ) : (
        <ul className="grid gap-4">
          <AnimatePresence initial>
            {visible.map((trip, i) => (
              <motion.li key={trip.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.05 }}>
                <TripCard trip={trip} onSelect={() => dispatch({ type: 'SELECT_TRIP', trip })} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
