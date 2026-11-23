import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { STEPS } from '@/state/bookingReducer'
import { useBooking } from '@/state/BookingContext'

const LABELS = ['Trips', 'Seats', 'Details', 'Ticket']

export default function StepBar() {
  const [{ step }, dispatch] = useBooking()
  const current = STEPS.indexOf(step) - 1
  const last = LABELS.length - 1

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="relative flex justify-between">
        <span aria-hidden="true" className="absolute left-4 right-4 top-4 h-px bg-line" />
        <motion.span aria-hidden="true" className="absolute left-4 right-4 top-4 h-px origin-left bg-forest"
          initial={false} animate={{ scaleX: current / last }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
        {LABELS.map((label, i) => {
          const done = i < current
          const canGoBack = done && step !== 'ticket'
          return (
            <li key={label} className="relative z-10 flex flex-col items-center gap-1.5">
              <button type="button" disabled={!canGoBack} onClick={() => dispatch({ type: 'GO', step: STEPS[i + 1] })}
                aria-current={i === current ? 'step' : undefined}
                className={clsx('grid h-8 w-8 place-items-center rounded-full text-sm font-medium tabular-nums transition-colors',
                  done ? 'bg-forest text-ivory' : i === current ? 'bg-brass text-ink' : 'border border-line bg-paper text-mute',
                  canGoBack && 'cursor-pointer hover:bg-forest-light')}>
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </button>
              <span className={clsx('text-xs font-medium', i <= current ? 'text-ink' : 'text-mute')}>{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
