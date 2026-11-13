import { describe, expect, it } from 'vitest'
import { allSeatIds } from '../lib/seats'
import { BUS_OPERATORS, hasTrains, trainDestinations, trainsBetween } from './operators'
import { DEFAULT_ROUTES, PLACES, placeById } from './cities'
import { bookedSeatsFor, generateTrips, totalSeats } from './trips'

const query = { mode: 'bus', from: 'd1', to: 'd43', date: '2026-11-13' } // Dhaka to Chattogram

describe('generateTrips', () => {
  const trips = generateTrips(query)
  it('is the same every time for the same search', () => {
    expect(generateTrips(query)).toEqual(trips)
  })
  it('lists trips in departure order with sensible values', () => {
    expect(trips).toHaveLength(7)
    expect(trips.map((t) => t.departMin)).toEqual([...trips.map((t) => t.departMin)].sort((a, b) => a - b))
    for (const t of trips) {
      expect(t.pricePerSeat % 10).toBe(0)
      expect(t.pricePerSeat).toBeGreaterThan(0)
      expect(t.durationMin).toBeGreaterThan(60)
      expect(t.seatsLeft).toBeGreaterThan(0)
      expect(t.seatsLeft).toBeLessThanOrEqual(totalSeats(t))
    }
  })
  it('uses real bus companies', () => {
    const names = new Set(BUS_OPERATORS.map((o) => o.name))
    expect(trips.every((t) => names.has(t.operator))).toBe(true)
  })
  it('numbers bus seats A1 A2 A3 A4, B1 ...', () => {
    const [bus] = trips
    expect(allSeatIds(bus.seatConfig).slice(0, 5)).toEqual(['A1', 'A2', 'A3', 'A4', 'B1'])
    expect(totalSeats(bus)).toBe(40)
  })
  it('gives a train coaches of 50 seats, with coach-prefixed Bangladesh-style seat numbers', () => {
    const trains = generateTrips({ ...query, ...DEFAULT_ROUTES.train, mode: 'train' })
    expect(trains.length).toBeGreaterThan(0)
    for (const train of trains) {
      expect(train.coaches.length).toBeGreaterThanOrEqual(2)
      expect(totalSeats(train)).toBe(50 * train.coaches.length)
      expect([...bookedSeatsFor(train)].every((k) => /^(BA|BHA|UMA|JA|KA|KHA|GA|GHA|CHA)-[A-J][1-5]$/.test(k))).toBe(true)
    }
  })
  it('only lists trains that really run between the two stations', () => {
    const names = generateTrips({ ...query, ...DEFAULT_ROUTES.train, mode: 'train' }).map((t) => t.operator)
    expect(names).toContain('Subarna Express')
    expect(names).not.toContain('Parabat Express') // that is the Sylhet line
    expect(generateTrips({ mode: 'train', from: 'sda', to: 'ssyl', date: query.date }).map((t) => t.operator)).toContain('Parabat Express')
  })
  it('uses the real timetable: departure and arrival come from the stops', () => {
    const [{ train, from, to }] = trainsBetween('sda', 'sctg')
    const trip = generateTrips({ mode: 'train', from: 'sda', to: 'sctg', date: query.date }).find((t) => t.departMin === from[2])
    expect(trip).toBeTruthy()
    expect(trip.durationMin).toBe((to[1] - from[2] + 1440) % 1440)
    expect(train.stops.length).toBeGreaterThan(2)
  })
  it('gives every class of one train the same departure time', () => {
    const trains = generateTrips({ ...query, ...DEFAULT_ROUTES.train, mode: 'train' })
    const byName = new Map()
    for (const t of trains) byName.set(t.operator, [...(byName.get(t.operator) ?? []), t.departMin])
    for (const times of byName.values()) expect(new Set(times).size).toBe(1)
  })
  it('sells bus tickets between two upazilas of the same district', () => {
    const [a, b] = PLACES.bus.filter((p) => p.sub === 'Upazila · Cumilla')
    const trips = generateTrips({ mode: 'bus', from: a.id, to: b.id, date: query.date })
    expect(trips).toHaveLength(7)
    expect(trips.every((t) => t.pricePerSeat >= 30 && t.durationMin >= 15)).toBe(true)
  })
})

describe('places', () => {
  it('covers every district and upazila by bus, and every railway station by train', () => {
    expect(PLACES.bus.filter((p) => p.kind === 'division')).toHaveLength(8)
    expect(PLACES.bus.filter((p) => p.kind === 'district')).toHaveLength(64)
    expect(PLACES.bus.filter((p) => p.kind === 'upazila').length).toBeGreaterThanOrEqual(490)
    expect(PLACES.train).toHaveLength(425)
  })
  it('has unique ids, a division and a position inside Bangladesh for every place', () => {
    const all = [...PLACES.bus, ...PLACES.train]
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length)
    for (const p of all) {
      expect(p.name).toBeTruthy()
      expect(p.div).toMatch(/^(barishal|chattogram|dhaka|khulna|mymensingh|rajshahi|rangpur|sylhet)$/)
      expect(p.lat).toBeGreaterThan(20.5)
      expect(p.lat).toBeLessThan(26.7)
      expect(p.lng).toBeGreaterThan(88)
      expect(p.lng).toBeLessThan(92.8)
    }
  })
  it('puts well-known places in the right division', () => {
    expect(placeById('d1').div).toBe('dhaka')
    expect(placeById('d54').div).toBe('sylhet')
    expect(placeById('sctg').div).toBe('chattogram')
    expect(placeById('srjq').div).toBe('rajshahi')
    expect(placeById('skln').div).toBe('khulna')
  })
})

describe('trainDestinations', () => {
  it('connects Kamalapur to the big cities', () => {
    const reach = trainDestinations('sda')
    for (const id of ['sctg', 'ssyl', 'srjq', 'skln', 'srnp', 'smym', 'scml']) expect(reach.has(id)).toBe(true)
    expect(reach.has('sda')).toBe(false)
  })
  it('does not connect stations with no direct train', () => {
    expect(trainDestinations('srnp').has('ssyl')).toBe(false)
  })
  it('knows which stations no train serves', () => {
    expect(hasTrains('sda')).toBe(true)
  })
})
