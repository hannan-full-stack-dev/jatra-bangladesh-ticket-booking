import { motion } from 'framer-motion'
import { HOLD_SECONDS } from '@/hooks/useHoldTimer'

/** Countdown ring for the seat hold. Turns red in the last minute. */
export default function HoldRing({ remaining }) {
  if (remaining === null) return null
  const low = remaining <= 60
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  return (
    <div role="timer" aria-label={`Seats held for ${minutes}:${seconds}`} className="flex items-center gap-3">
      <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#14211B" strokeOpacity=".1" strokeWidth="4" />
        <motion.circle cx="22" cy="22" r="18" fill="none" stroke={low ? '#B3261E' : '#C8A24A'} strokeWidth="4" strokeLinecap="round"
          pathLength={1} strokeDasharray="1 1" initial={false}
          animate={{ strokeDashoffset: 1 - remaining / HOLD_SECONDS }} transition={{ duration: 1, ease: 'linear' }} />
      </svg>
      <div>
        <p className={`font-display text-xl tabular-nums ${low ? 'text-danger' : ''}`}>{minutes}:{seconds}</p>
        <p className="text-xs text-mute">Seats held for you</p>
      </div>
    </div>
  )
}
