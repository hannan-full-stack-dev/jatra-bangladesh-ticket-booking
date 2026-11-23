import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { X } from 'lucide-react'
import Logo from '@/components/Logo'
import StepBar from '@/components/StepBar'
import { BookingContext, useBooking } from '@/state/BookingContext'
import CheckoutScreen from '@/screens/CheckoutScreen'
import ResultsScreen from '@/screens/ResultsScreen'
import SearchScreen from '@/screens/SearchScreen'
import SeatScreen from '@/screens/SeatScreen'
import TicketScreen from '@/screens/TicketScreen'

const SCREENS = { search: SearchScreen, results: ResultsScreen, seats: SeatScreen, checkout: CheckoutScreen, ticket: TicketScreen }

/** Screens slide in the direction you are travelling: forward from the right, back from the left. */
const page = {
  enter: (direction) => ({ opacity: 0, x: 24 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: -24 * direction }),
}

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const id = setTimeout(onClose, 3800)
    return () => clearTimeout(id)
  }, [message, onClose])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8">
      <AnimatePresence>
        {message && (
          <motion.div key={message} role="status"
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2.5 pl-5 pr-2.5 text-sm text-ivory shadow-lift">
            {message}
            <button onClick={onClose} aria-label="Dismiss message" className="grid h-7 w-7 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


/** Safety net: if any screen ever throws, show a way back instead of a blank page. */
class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-8 text-center shadow-lift">
        <p className="font-display text-2xl">Something went wrong</p>
        <p className="mt-1 text-mute">Your search could not be shown. Start again, nothing was charged.</p>
        <button onClick={() => { this.props.onReset(); this.setState({ failed: false }) }} className="mt-5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory">Start over</button>
      </div>
    )
  }
}

/** Longest we wait for a screen to finish leaving. After this the next screen is shown no matter what. */
const EXIT_TIMEOUT_MS = 600
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Hand-rolled page transition instead of <AnimatePresence mode="wait">.
 *
 * AnimatePresence only removes the old screen once every animation inside it reports "done". A shared-layout
 * animation (the sliding pill on the Bus/Train switch, for example) can leave it waiting forever, so after
 * "Find trips" the old screen stayed on top and nothing happened until the page was refreshed.
 * Here the old screen plays its exit, but we never wait longer than EXIT_TIMEOUT_MS for it.
 */
function usePageTransition(step, live) {
  const [shown, setShown] = useState(step)
  const controls = useAnimationControls()
  // While a screen is leaving it keeps the data it had. Otherwise "Book another trip" clears the booking
  // under the old ticket, which then crashes while fading out.
  const frozen = useRef(live)
  if (shown === step) frozen.current = live

  useEffect(() => {
    if (shown === step) { controls.start('center'); return undefined }
    let cancelled = false
    Promise.race([controls.start('exit'), wait(EXIT_TIMEOUT_MS)]).then(() => {
      if (cancelled) return
      controls.stop()
      controls.set('enter')
      setShown(step)
    })
    return () => { cancelled = true }
  }, [step, shown, controls])

  return { shown, controls, bookingValue: frozen.current, leaving: shown !== step }
}

export default function App() {
  const live = useBooking()
  const [{ step, direction, notice }, dispatch] = live
  const { shown, controls, bookingValue, leaving } = usePageTransition(step, live)
  const Screen = SCREENS[shown]
  const dismiss = useCallback(() => dispatch({ type: 'DISMISS_NOTICE' }), [dispatch])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [shown])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-ivory">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <button onClick={() => dispatch({ type: 'RESET' })} aria-label="Jatra, start over"><Logo /></button>
          <span className="text-sm text-mute">Demo, no real payments</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 md:px-6 lg:pb-16">
        {step !== 'search' && <StepBar />}
        <motion.div custom={direction} variants={page} initial="enter" animate={controls}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} style={{ pointerEvents: leaving ? 'none' : 'auto' }}>
          <BookingContext.Provider value={bookingValue}>
            <ErrorBoundary key={shown} onReset={() => dispatch({ type: 'RESET' })}>
              <Screen />
            </ErrorBoundary>
          </BookingContext.Provider>
        </motion.div>
      </main>
      <Toast message={notice} onClose={dismiss} />
    </div>
  )
}
