import { hashString } from './random'
import { priceBooking } from './pricing'

export const makeBookingId = (seed) => `JT-${hashString(seed).toString(36).toUpperCase().padStart(6, '0').slice(-6)}`

/** Turns the finished checkout state into an immutable booking record. */
export function createBooking(state, now = Date.now()) {
  const price = priceBooking({ pricePerSeat: state.trip.pricePerSeat, seatCount: state.seats.length, promo: state.promo })
  return {
    id: makeBookingId(`${state.trip.id}|${state.seats.join(',')}|${now}`),
    trip: state.trip, seats: state.seats, passengers: state.passengers,
    contact: state.contact, payment: state.payment, price, paidAt: now,
  }
}
