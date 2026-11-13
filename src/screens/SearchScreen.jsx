import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ArrowRight, Bus, Info, MapPin, Navigation, TrainFront } from 'lucide-react'
import AnimatedNumber from '@/components/AnimatedNumber'
import Button from '@/components/Button'
import { TextField } from '@/components/Field'
import PlacePicker from '@/components/PlacePicker'
import RouteArt from '@/components/RouteArt'
import SegmentedControl from '@/components/SegmentedControl'
import { POPULAR, cityById } from '@/data/cities'
import { trainDestinations, trainsBetween } from '@/data/operators'
import { generateTrips, routeKm } from '@/data/trips'
import { formatClock, formatDuration, toIsoDate } from '@/lib/format'
import { useBooking } from '@/state/BookingContext'

const MODE_OPTIONS = [
  { value: 'bus', label: 'Bus', icon: <Bus className="h-4 w-4" aria-hidden="true" /> },
  { value: 'train', label: 'Train', icon: <TrainFront className="h-4 w-4" aria-hidden="true" /> },
]

/** Each word rises out of a mask, one after another. */
function Words({ text, delay = 0, className = '' }) {
  return text.split(' ').map((word, i) => (
    <span key={i} className="inline-block overflow-hidden pb-1.5 align-bottom">
      <motion.span className={`inline-block ${className}`} initial={{ y: '110%' }} animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.07 }}>
        {word}&nbsp;
      </motion.span>
    </span>
  ))
}

export default function SearchScreen() {
  const [{ mode, from, to, date }, dispatch] = useBooking()
  const [swaps, setSwaps] = useState(0)
  // Buses go between any two districts or upazilas, trains between any two stations. By train, some pairs have a direct service.
  const km = routeKm(mode, from, to)
  const direct = mode === 'train' ? trainsBetween(from, to) : null
  const directFrom = useMemo(() => (mode === 'train' ? trainDestinations(from) : undefined), [mode, from])
  const noTrain = mode === 'train' && direct.length === 0
  // The first trip is exactly what the first card on the next screen shows, so the preview and the results never disagree.
  const first = useMemo(() => (noTrain ? null : generateTrips({ mode, from, to, date })[0] ?? null), [noTrain, mode, from, to, date])
  const minutes = direct?.length
    ? Math.min(...direct.map(({ from: a, to: b }) => Math.max(5, (b[1] - a[2] + 1440) % 1440)))
    : first?.durationMin
  const field = (name) => (e) => dispatch({ type: 'SET_FIELD', field: name, value: e.target.value })

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex rounded-full bg-brass-soft px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brass-dark">
          Intercity tickets · Bangladesh
        </motion.p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
          <Words text="Pick your seat." />
          <br />
          <Words text="Skip the queue." delay={0.25} className="italic text-forest-light" />
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-5 max-w-md text-lg text-mute">
          Bus and train tickets across the country, in under a minute. See the seat map before you pay.
        </motion.p>

        <motion.form initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SEARCH' }) }}
          className="mt-8 rounded-3xl border border-line bg-paper p-5 shadow-lift">
          <SegmentedControl label="Travel by" options={MODE_OPTIONS} value={mode} layoutId="mode-pill"
            onChange={(value) => dispatch({ type: 'SET_MODE', mode: value })} />
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <PlacePicker id="from" label="From" mode={mode} value={from} exclude={to} icon={MapPin}
              onChange={(value) => dispatch({ type: 'SET_FIELD', field: 'from', value })} />
            <motion.button type="button" aria-label="Swap places" animate={{ rotate: swaps * 180 }} whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              onClick={() => { setSwaps((n) => n + 1); dispatch({ type: 'SWAP' }) }}
              className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-ivory hover:border-forest/40">
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <PlacePicker id="to" label="To" mode={mode} value={to} exclude={from} direct={directFrom} icon={Navigation}
              onChange={(value) => dispatch({ type: 'SET_FIELD', field: 'to', value })} />
          </div>
          {mode === 'train' && (
            <p role="status" className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${direct.length ? 'bg-brass-soft/60 text-brass-dark' : 'bg-danger/5 text-danger'}`}>
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {direct.length
                ? `${direct.length} direct ${direct.length === 1 ? 'train' : 'trains'} run from ${cityById(from).name} to ${cityById(to).name}.`
                : `No direct train from ${cityById(from).name} to ${cityById(to).name}. Pick a station tagged Direct, or swap the two.`}
            </p>
          )}
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <TextField id="date" label="Date" type="date" min={toIsoDate(new Date())} value={date} onChange={field('date')} required />
            <Button type="submit" className="w-full sm:w-auto">Find trips<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Button>
          </div>
        </motion.form>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-mute">Popular:</span>
          {POPULAR.map((p, i) => (
            <motion.button key={`${p.from}-${p.to}`} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.07 }}
              whileHover={{ y: -2 }} onClick={() => dispatch({ type: 'SET_ROUTE', ...p })}
              className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm hover:border-brass">
              {cityById(p.from).name} → {cityById(p.to).name}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.aside initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Route preview" className="grid-lines relative overflow-hidden rounded-[32px] bg-forest-deep p-6 text-ivory shadow-lift">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brass/20 blur-3xl" />
        <RouteArt from={from} to={to} mode={mode} />
        <dl className="relative mt-2 grid grid-cols-2 gap-4 border-t border-ivory/15 pt-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-ivory/50">{mode === 'train' ? 'Rail distance' : 'Road distance (est.)'}</dt>
            <dd className="font-display text-3xl">
              {noTrain ? '—' : <>{mode === 'bus' && <span className="text-base text-ivory/60">≈ </span>}<AnimatedNumber value={km} /> <span className="text-base text-ivory/60">km</span></>}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-ivory/50">{mode === 'train' ? 'Fastest train' : 'Travel time'}</dt>
            <dd className="font-display text-3xl">{noTrain || minutes == null ? '—' : <AnimatedNumber value={minutes} format={(n) => formatDuration(Math.round(n / 5) * 5)} />}</dd>
          </div>
          {first && (
            <div className="col-span-2 border-t border-ivory/15 pt-3">
              <dt className="text-xs uppercase tracking-[0.14em] text-ivory/50">
                {mode === 'train' ? 'First train' : 'Earliest bus'} · {first.operator}
              </dt>
              <dd className="font-display text-xl">
                {formatClock(first.departMin)} <span className="text-ivory/50">→</span> {formatClock(first.arriveMin)}
                {first.arriveMin >= 1440 && <span className="ml-2 font-sans text-xs text-ivory/60">next day</span>}
              </dd>
            </div>
          )}
        </dl>
      </motion.aside>
    </div>
  )
}
