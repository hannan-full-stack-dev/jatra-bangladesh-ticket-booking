import { describe, expect, it } from 'vitest'
import { createBooking } from '../lib/booking'
import { bookingReducer, createInitialState } from './bookingReducer'

const trip = { id: 't1', pricePerSeat: 1000, coaches: [''], seatConfig: { rows: 2, layout: [2, 2] } }
const run = (state, ...actions) => actions.reduce(bookingReducer, state)
const none = new Set()

describe('bookingReducer', () => {
  it('searches only with two different cities', () => {
    const same = { ...createInitialState(), to: 'd1' }
    expect(bookingReducer(same, { type: 'SEARCH' }).step).toBe('search')
    expect(bookingReducer(createInitialState(), { type: 'SEARCH' }).step).toBe('results')
  })

  it('lets you pick any two places, and keeps them as you set them', () => {
    const state = run(createInitialState(), { type: 'SET_FIELD', field: 'from', value: 'u1' }, { type: 'SET_FIELD', field: 'to', value: 'd45' })
    expect([state.from, state.to]).toEqual(['u1', 'd45'])
  })

  it('does not blank the booking-dependent screens: RESET clears the booking and trip', () => {
    const done = run(createInitialState(), { type: 'SELECT_TRIP', trip }, { type: 'CONFIRM', booking: { id: 'JT-1' } })
    const fresh = bookingReducer(done, { type: 'RESET' })
    expect(fresh.booking).toBeNull()
    expect(fresh.step).toBe('search')
  })

  it('starts each mode on its own route, since buses and trains stop at different places', () => {
    const state = run(createInitialState(), { type: 'SET_ROUTE', from: 'd1', to: 'd45', mode: 'bus' }, { type: 'SET_MODE', mode: 'train' })
    expect([state.from, state.to]).toEqual(['sda', 'sctg'])
    expect(bookingReducer(state, { type: 'SET_MODE', mode: 'bus' }).from).toBe('d1')
  })

  it('starts the hold on the first seat and clears it with the last', () => {
    const picked = run(createInitialState(), { type: 'SELECT_TRIP', trip }, { type: 'TOGGLE_SEAT', key: 'A1', booked: none, now: 5000 })
    expect(picked.holdStartedAt).toBe(5000)
    expect(bookingReducer(picked, { type: 'TOGGLE_SEAT', key: 'A1', booked: none, now: 6000 }).holdStartedAt).toBeNull()
  })

  it('keeps the original hold start when more seats are added', () => {
    const state = run(createInitialState(), { type: 'SELECT_TRIP', trip },
      { type: 'TOGGLE_SEAT', key: 'A1', booked: none, now: 5000 }, { type: 'TOGGLE_SEAT', key: 'A2', booked: none, now: 9000 })
    expect(state.holdStartedAt).toBe(5000)
  })

  it('explains why a fifth seat is refused', () => {
    let state = run(createInitialState(), { type: 'SELECT_TRIP', trip })
    for (const key of ['A1', 'A2', 'A3', 'A4', 'B1']) state = bookingReducer(state, { type: 'TOGGLE_SEAT', key, booked: none, now: 1 })
    expect(state.seats).toHaveLength(4)
    expect(state.notice).toContain('4 seats')
  })

  it('creates one passenger row per seat and will not continue without seats', () => {
    const empty = run(createInitialState(), { type: 'SELECT_TRIP', trip })
    expect(bookingReducer(empty, { type: 'CONTINUE' }).step).toBe('seats')
    const state = run(empty, { type: 'TOGGLE_SEAT', key: 'A1', booked: none, now: 1 }, { type: 'TOGGLE_SEAT', key: 'A2', booked: none, now: 1 }, { type: 'CONTINUE' })
    expect(state.step).toBe('checkout')
    expect(state.passengers).toHaveLength(2)
  })

  it('lets you go back, but never out of a finished ticket', () => {
    const atCheckout = run(createInitialState(), { type: 'SELECT_TRIP', trip }, { type: 'TOGGLE_SEAT', key: 'A1', booked: none, now: 1 }, { type: 'CONTINUE' })
    expect(bookingReducer(atCheckout, { type: 'GO', step: 'seats' }).direction).toBe(-1)
    const ticket = bookingReducer(atCheckout, { type: 'CONFIRM', booking: createBooking(atCheckout, 99) })
    expect(bookingReducer(ticket, { type: 'GO', step: 'seats' }).step).toBe('ticket')
  })

  it('drops the seats and returns to the seat map when the hold expires', () => {
    const held = run(createInitialState(), { type: 'SELECT_TRIP', trip }, { type: 'TOGGLE_SEAT', key: 'A1', booked: none, now: 1 }, { type: 'CONTINUE' })
    const expired = bookingReducer(held, { type: 'EXPIRE' })
    expect(expired.step).toBe('seats')
    expect(expired.seats).toEqual([])
  })
})

describe('createBooking', () => {
  it('makes a JT- booking id and prices the seats', () => {
    const state = { ...createInitialState(), trip, seats: ['A1', 'A2'], promo: '' }
    const booking = createBooking(state, 1234)
    expect(booking.id).toMatch(/^JT-[0-9A-Z]{6}$/)
    expect(booking.price.total).toBe(2040)
  })
})
