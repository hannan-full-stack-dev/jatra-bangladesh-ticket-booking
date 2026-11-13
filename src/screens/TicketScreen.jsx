import { motion } from 'framer-motion'
import { Plus, Printer } from 'lucide-react'
import Button from '@/components/Button'
import Confetti from '@/components/Confetti'
import Qr from '@/components/Qr'
import { cityById } from '@/data/cities'
import { formatClock, formatDate, formatMoney } from '@/lib/format'
import { useBooking } from '@/state/BookingContext'

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-mute">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

export default function TicketScreen() {
  const [{ booking }, dispatch] = useBooking()
  if (!booking) return null
  const { trip, seats, passengers, price, payment } = booking
  const arrives = trip.arriveMin >= 1440 ? `${formatClock(trip.arriveMin)} (+1 day)` : formatClock(trip.arriveMin)

  return (
    <section aria-labelledby="ticket-title" className="mx-auto max-w-xl">
      <div className="relative mb-8 flex flex-col items-center text-center">
        <Confetti />
        <svg viewBox="0 0 52 52" className="h-16 w-16" aria-hidden="true">
          <motion.circle cx="26" cy="26" r="23" fill="none" stroke="#C8A24A" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
          <motion.path d="M15 27l8 8 14-16" fill="none" stroke="#0F3D2E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55, duration: 0.45 }} />
        </svg>
        <h1 id="ticket-title" className="mt-4 font-display text-4xl tracking-tight">You’re all set</h1>
        <p className="mt-1 text-mute">Your seats are confirmed. Show this ticket at boarding.</p>
      </div>

      <div style={{ perspective: 1200 }}>
        <motion.article initial={{ opacity: 0, y: 60, rotateX: -14 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.35 }}
          className="print-ticket relative rounded-3xl border border-line bg-paper shadow-lift">
          <div className="rounded-t-3xl bg-forest-deep px-6 py-5 text-ivory">
            <p className="text-xs uppercase tracking-[0.18em] text-brass">{trip.mode === 'bus' ? 'Bus ticket' : 'Train ticket'} · {trip.operator}</p>
            <p className="mt-2 font-display text-3xl">{cityById(trip.from).name} → {cityById(trip.to).name}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
            <Detail label="Date">{formatDate(trip.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</Detail>
            <Detail label="Class">{trip.cls}</Detail>
            <Detail label="Departs">{formatClock(trip.departMin)}</Detail>
            <Detail label="Arrives">{arrives}</Detail>
            <Detail label="Seats">{seats.join(', ')}</Detail>
            <Detail label="Passengers">{passengers.map((p) => p.name).join(', ')}</Detail>
          </dl>

          {/* Perforation: two notches and a dashed line. */}
          <div className="relative mx-3 border-t-2 border-dashed border-line" aria-hidden="true">
            <span className="absolute -left-6 -top-3 h-6 w-6 rounded-full bg-ivory" />
            <span className="absolute -right-6 -top-3 h-6 w-6 rounded-full bg-ivory" />
          </div>

          <div className="flex items-center justify-between gap-4 px-6 py-6">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-mute">Booking ID</p>
              <p className="font-mono text-2xl font-semibold tracking-wider">{booking.id}</p>
              <p className="mt-3 text-sm text-mute">Paid with {payment === 'bkash' ? 'bKash' : payment === 'nagad' ? 'Nagad' : 'card'}</p>
              <p className="font-display text-2xl tabular-nums">{formatMoney(price.total)}</p>
            </div>
            <Qr seed={booking.id} />
          </div>
        </motion.article>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="ghost" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden="true" />Print ticket</Button>
        <Button onClick={() => dispatch({ type: 'RESET' })}><Plus className="h-4 w-4" aria-hidden="true" />Book another trip</Button>
      </div>
    </section>
  )
}
