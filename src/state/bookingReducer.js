import { DEFAULT_ROUTES, destinationsFor, isPlaceFor } from '../data/cities'
import { addDays, toIsoDate } from '../lib/format'
import { MAX_SEATS, toggleSeat } from '../lib/seats'

export const STEPS = ['search', 'results', 'seats', 'checkout', 'ticket']

export const createInitialState = (today = new Date()) => ({
  step: 'search', direction: 1,
  mode: 'bus', ...DEFAULT_ROUTES.bus, date: toIsoDate(addDays(today, 1)),
  trip: null, coach: '', seats: [], holdStartedAt: null,
  passengers: [], contact: { phone: '', email: '' }, promo: '', payment: 'bkash',
  booking: null, notice: null,
})

/** Moving forward slides the screen in from the right, moving back slides it from the left. */
const goTo = (state, step) => ({ ...state, step, direction: STEPS.indexOf(step) >= STEPS.indexOf(state.step) ? 1 : -1 })

/** Keeps the route possible: both places must belong to the mode, and by train they must share a real line. */
function withValidRoute(state) {
  const { mode, from, to } = state
  if (!isPlaceFor(mode, from)) return { ...state, ...DEFAULT_ROUTES[mode] }
  const options = destinationsFor(mode, from)
  if (options.some((p) => p.id === to)) return state
  const preferred = options.find((p) => p.id === DEFAULT_ROUTES[mode].to) ?? options[0]
  return preferred ? { ...state, to: preferred.id } : { ...state, ...DEFAULT_ROUTES[mode] }
}

export function bookingReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE': return withValidRoute({ ...state, mode: action.mode })
    case 'SET_FIELD': {
      const next = { ...state, [action.field]: action.value }
      return action.field === 'from' || action.field === 'to' ? withValidRoute(next) : next
    }
    case 'SET_ROUTE': return { ...state, from: action.from, to: action.to, mode: action.mode }
    case 'SWAP': return { ...state, from: state.to, to: state.from }

    case 'SEARCH':
      if (state.from === state.to) return { ...state, notice: 'Choose two different cities.' }
      return { ...goTo(state, 'results'), trip: null, seats: [], holdStartedAt: null, notice: null }

    case 'SELECT_TRIP':
      return { ...goTo(state, 'seats'), trip: action.trip, coach: action.trip.coaches[0], seats: [], holdStartedAt: null, notice: null }

    case 'SET_COACH': return { ...state, coach: action.coach }

    case 'TOGGLE_SEAT': {
      const { selected, reason } = toggleSeat(state.seats, action.key, { booked: action.booked })
      const notice = reason === 'limit' ? `You can book up to ${MAX_SEATS} seats at a time.`
        : reason === 'booked' ? 'That seat is already taken.' : null
      return { ...state, seats: selected, notice, holdStartedAt: selected.length === 0 ? null : (state.holdStartedAt ?? action.now) }
    }

    case 'CONTINUE':
      if (state.seats.length === 0) return state
      return { ...goTo(state, 'checkout'), passengers: state.seats.map((_, i) => state.passengers[i] ?? { name: '' }) }

    case 'SET_PASSENGER':
      return { ...state, passengers: state.passengers.map((p, i) => (i === action.index ? { name: action.name } : p)) }
    case 'SET_CONTACT': return { ...state, contact: { ...state.contact, [action.field]: action.value } }
    case 'SET_PROMO': return { ...state, promo: action.code }
    case 'SET_PAYMENT': return { ...state, payment: action.payment }

    case 'CONFIRM': return { ...goTo(state, 'ticket'), booking: action.booking, holdStartedAt: null }

    case 'EXPIRE':
      return { ...goTo(state, 'seats'), seats: [], holdStartedAt: null, notice: 'Your seat hold expired. Please pick your seats again.' }

    case 'GO':
      return STEPS.indexOf(action.step) < STEPS.indexOf(state.step) && state.step !== 'ticket' ? goTo(state, action.step) : state

    case 'DISMISS_NOTICE': return { ...state, notice: null }
    case 'RESET': return { ...createInitialState(), direction: -1 }
    default: return state
  }
}
