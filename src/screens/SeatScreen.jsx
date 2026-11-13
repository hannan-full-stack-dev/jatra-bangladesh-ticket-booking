import { useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Button from '@/components/Button'
import FareBreakdown from '@/components/FareBreakdown'
import HoldRing from '@/components/HoldRing'
import SeatMap from '@/components/SeatMap'
import SegmentedControl from '@/components/SegmentedControl'
import { cityById } from '@/data/cities'
import { bookedSeatsFor } from '@/data/trips'
import { useHoldTimer } from '@/hooks/useHoldTimer'
import { formatClock, formatDate, formatMoney } from '@/lib/format'
import { priceBooking } from '@/lib/pricing'
import { MAX_SEATS } from '@/lib/seats'
import { useBooking } from '@/state/BookingContext'

function Legend() {
  const item = 'flex items-center gap-2 text-xs text-ivory/70'
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
      <li className={item}><span className="h-4 w-4 rounded-t-md rounded-b-sm border border-ivory/25 bg-ivory/10" />Available</li>
      <li className={item}><span className="h-4 w-4 rounded-t-md rounded-b-sm bg-brass" />Selected</li>
      <li className={item}><span className="h-4 w-4 rounded-t-md rounded-b-sm bg-ivory/5" />Taken</li>
    </ul>
  )
}

export default function SeatScreen() {
  const [{ trip, coach, seats, holdStartedAt, promo }, dispatch] = useBooking()
  const booked = useMemo(() => bookedSeatsFor(trip), [trip])
  const onToggle = useCallback((key) => dispatch({ type: 'TOGGLE_SEAT', key, booked, now: Date.now() }), [dispatch, booked])
  const remaining = useHoldTimer(holdStartedAt, () => dispatch({ type: 'EXPIRE' }))
  const price = priceBooking({ pricePerSeat: trip.pricePerSeat, seatCount: seats.length, promo })
  const next = () => dispatch({ type: 'CONTINUE' })

  return (
    <section aria-labelledby="seats-title">
      <Button variant="ghost" className="mb-5 min-h-10 px-4 text-sm" onClick={() => dispatch({ type: 'GO', step: 'results' })}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />All trips
      </Button>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid-lines relative overflow-hidden rounded-[32px] bg-forest-deep p-6 text-ivory shadow-lift md:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brass/15 blur-3xl" />
          <div className="relative">
            <h1 id="seats-title" className="font-display text-3xl md:text-4xl">Choose your seats</h1>
            <p className="mt-1 text-ivory/60">Pick up to {MAX_SEATS}. Seats are held for you once you pick the first one.</p>
            {trip.coaches.length > 1 && (
              <div className="mt-5">
                <SegmentedControl tone="dark" label="Coach" layoutId="coach-pill" value={coach}
                  options={trip.coaches.map((c) => ({ value: c, label: `Coach ${c}` }))}
                  onChange={(value) => dispatch({ type: 'SET_COACH', coach: value })} />
              </div>
            )}
            <div className="mt-6">
              <SeatMap config={trip.seatConfig} coach={coach} booked={booked} selected={seats} onToggle={onToggle} />
            </div>
            <Legend />
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-paper p-6 shadow-lift lg:sticky lg:top-24" aria-label="Booking summary">
          <p className="text-sm text-mute">{trip.operator} · {trip.cls}</p>
          <h2 className="font-display text-2xl">{cityById(trip.from).name} → {cityById(trip.to).name}</h2>
          <p className="mt-1 text-sm text-mute">{formatDate(trip.date)} · {formatClock(trip.departMin)}</p>

          <div className="my-5 min-h-[3.5rem] border-y border-line py-4">
            {seats.length === 0 ? (
              <p className="text-sm text-mute">Tap a seat to begin.</p>
            ) : (
              <ul className="flex flex-wrap gap-2" aria-label="Selected seats">
                <AnimatePresence initial={false}>
                  {seats.map((key) => (
                    <motion.li key={key} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      className="rounded-lg bg-brass-soft px-2.5 py-1 text-sm font-semibold text-brass-dark">{key}</motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <div className="mb-5"><HoldRing remaining={remaining} /></div>
          <FareBreakdown price={price} seatCount={seats.length} />
          <Button variant="brass" className="mt-6 hidden w-full lg:inline-flex" disabled={seats.length === 0} onClick={next}>
            Continue<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">
        {seats.length === 0 ? 'No seats selected.' : `${seats.length} seats selected: ${seats.join(', ')}. Total ${formatMoney(price.total)}.`}
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs text-mute">{seats.length} {seats.length === 1 ? 'seat' : 'seats'}</p>
          <p className="font-display text-2xl tabular-nums">{formatMoney(price.total)}</p>
        </div>
        <Button variant="brass" disabled={seats.length === 0} onClick={next}>Continue<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
      </div>
    </section>
  )
}
