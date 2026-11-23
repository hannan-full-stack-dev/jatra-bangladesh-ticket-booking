import { memo, useMemo } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { buildSeatGrid, seatKey } from '@/lib/seats'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const rowVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const HATCH = 'repeating-linear-gradient(135deg, rgba(246,241,231,.07) 0 4px, transparent 4px 8px)'

const Seat = memo(function Seat({ label, seatId, state, onToggle }) {
  const taken = state === 'booked'
  const selected = state === 'selected'
  return (
    <motion.button type="button" disabled={taken} aria-pressed={selected} onClick={() => onToggle(seatId)}
      aria-label={`Seat ${seatId}, ${taken ? 'taken' : selected ? 'selected' : 'available'}`}
      whileTap={taken ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.12 }}
      style={taken ? { backgroundImage: HATCH } : undefined}
      className={clsx('grid h-11 w-11 place-items-center rounded-b-md rounded-t-[14px] text-xs font-medium transition-colors',
        taken && 'cursor-not-allowed bg-ivory/5 text-ivory/25',
        selected && 'bg-brass text-ink',
        state === 'available' && 'border border-ivory/25 bg-ivory/10 text-ivory/85 hover:bg-ivory/20')}>
      {label}
    </motion.button>
  )
})

/** The cabin. Rows fade in one after another; whenever the coach changes the whole map replays. */
export default function SeatMap({ config, coach, booked, selected, onToggle }) {
  const grid = useMemo(() => buildSeatGrid(config), [config])
  const cell = (id) => {
    const key = seatKey(coach, id)
    const state = booked.has(key) ? 'booked' : selected.includes(key) ? 'selected' : 'available'
    return <Seat key={key} label={id} seatId={key} state={state} onToggle={onToggle} />
  }

  return (
    <div className="mx-auto w-fit rounded-[40px] border border-ivory/15 px-6 pb-5 pt-4">
      <p className="mb-4 flex items-center justify-center gap-1.5 text-xs text-ivory/55">
        <ArrowUp className="h-3 w-3" aria-hidden="true" />Front{coach ? ` · Coach ${coach}` : ''}
      </p>
      <motion.div key={coach} variants={container} initial="hidden" animate="show" role="group" aria-label="Seat map">
        {grid.map(({ row, left, right }) => (
          <motion.div key={row} variants={rowVariants} className="mb-2 flex items-center justify-center gap-2">
            {left.map(cell)}
            <span className="w-7 text-center text-xs text-ivory/45" aria-hidden="true">{row}</span>
            {right.map(cell)}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
