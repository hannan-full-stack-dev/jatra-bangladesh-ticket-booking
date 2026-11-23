import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ArrowRight, Bus, TrainFront } from 'lucide-react'
import AnimatedNumber from '@/components/AnimatedNumber'
import Button from '@/components/Button'
import { TextField } from '@/components/Field'
import PlacePicker from '@/components/PlacePicker'
import RouteArt from '@/components/RouteArt'
import SegmentedControl from '@/components/SegmentedControl'
import { POPULAR, destinationsFor, placeById, placesFor } from '@/data/cities'
import { MODES } from '@/data/trips'
import { distanceKm } from '@/lib/geo'
import { formatDuration, toIsoDate } from '@/lib/format'
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
  // Any place can be the start. If it has no direct train to the current destination, the reducer moves the destination.
  const noun = mode === 'train' ? 'stations' : 'districts and upazilas'
  const fromOptions = placesFor(mode).filter((p) => p.id !== to)
  const toOptions = destinationsFor(mode, from)
  const km = distanceKm(placeById(from), placeById(to))
  const minutes = Math.round(((km / MODES[mode].speedKmh) * 60) / 5) * 5
  const field = (name) => (e) => dispatch({ type: 'SET_FIELD', field: name, value: e.target.value })

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-4 text-sm font-medium text-brass-dark">Intercity bus and train tickets in Bangladesh</p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
          <Words text="Choose your seat" />
          <br />
          <Words text="before you pay" delay={0.25} className="text-forest-light" />
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-5 max-w-md text-lg text-mute">
          Choose any district or upazila by bus, or any railway station by train, then pick your seat on the seat map
        </motion.p>

        <motion.form initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SEARCH' }) }}
          className="mt-8 rounded-3xl border border-line bg-paper p-5 shadow-lift">
          <SegmentedControl label="Travel by" options={MODE_OPTIONS} value={mode} layoutId="mode-pill"
            onChange={(value) => dispatch({ type: 'SET_MODE', mode: value })} />
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <PlacePicker id="from" label="From" noun={noun} value={from} options={fromOptions}
              onChange={(value) => dispatch({ type: 'SET_FIELD', field: 'from', value })} />
            <motion.button type="button" aria-label="Swap places" animate={{ rotate: swaps * 180 }} whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => { setSwaps((n) => n + 1); dispatch({ type: 'SWAP' }) }}
              className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-ivory hover:border-forest/40">
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <PlacePicker id="to" label="To" align="right" noun={noun} value={to} options={toOptions}
              onChange={(value) => dispatch({ type: 'SET_FIELD', field: 'to', value })} />
          </div>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <TextField id="date" label="Date" type="date" min={toIsoDate(new Date())} value={date} onChange={field('date')} required />
            <Button type="submit" className="w-full sm:w-auto">Find trips<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Button>
          </div>
        </motion.form>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-mute">Popular:</span>
          {POPULAR.map((p, i) => (
            <motion.button key={`${p.from}-${p.to}`} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.07 }}
              onClick={() => dispatch({ type: 'SET_ROUTE', ...p })}
              className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm hover:border-brass">
              {placeById(p.from).name} → {placeById(p.to).name}<span className="ml-1.5 text-mute">{p.mode === 'train' ? 'Train' : 'Bus'}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Route preview" className="relative overflow-hidden rounded-3xl bg-forest-deep p-6 text-ivory shadow-lift">
        <RouteArt from={from} to={to} mode={mode} />
        <dl className="relative mt-2 grid grid-cols-2 gap-4 border-t border-ivory/15 pt-4">
          <div>
            <dt className="text-sm text-ivory/60">Distance</dt>
            <dd className="font-display text-3xl"><AnimatedNumber value={km} /> <span className="text-base text-ivory/60">km</span></dd>
          </div>
          <div>
            <dt className="text-sm text-ivory/60">Usual travel time</dt>
            <dd className="font-display text-3xl"><AnimatedNumber value={minutes} format={(n) => formatDuration(Math.round(n / 5) * 5)} /></dd>
          </div>
        </dl>
      </motion.aside>
    </div>
  )
}
