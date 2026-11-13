import { describe, expect, it } from 'vitest'
import { selectTrips } from './tripFilters'

const trips = [
  { id: 'a', departMin: 600, pricePerSeat: 900, durationMin: 400 },
  { id: 'b', departMin: 300, pricePerSeat: 1200, durationMin: 300 },
  { id: 'c', departMin: 1200, pricePerSeat: 700, durationMin: 350 },
]
const ids = (list) => list.map((t) => t.id)

describe('selectTrips', () => {
  it('filters by time of day', () => {
    expect(ids(selectTrips(trips, { period: 'morning', sort: 'earliest' }))).toEqual(['b', 'a'])
    expect(ids(selectTrips(trips, { period: 'night', sort: 'earliest' }))).toEqual(['c'])
  })
  it('sorts by price and by speed', () => {
    expect(ids(selectTrips(trips, { period: 'all', sort: 'cheapest' }))).toEqual(['c', 'a', 'b'])
    expect(ids(selectTrips(trips, { period: 'all', sort: 'fastest' }))).toEqual(['b', 'c', 'a'])
  })
})
