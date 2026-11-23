import { describe, expect, it } from 'vitest'
import { allSeatIds } from '../lib/seats'
import { BUS_PLACES, DISTRICTS, STATIONS, UPAZILAS } from './cities'
import { BUS_OPERATORS, trainDestinations, trainsBetween } from './operators'
import { bookedSeatsFor, generateTrips, totalSeats } from './trips'

const up = (name) => UPAZILAS.find((u) => u.name === name).id
const st = (name) => STATIONS.find((s) => s.name === name).id
const query = { mode: 'bus', from: up('Savar'), to: up("Cox's Bazar Sadar"), date: '2026-11-13' }
const trainQuery = { mode: 'train', from: st('Kamalapur'), to: st('Chattogram'), date: '2026-11-13' }

describe('generateTrips', () => {
  const trips = generateTrips(query)
  it('is the same every time for the same search', () => {
    expect(generateTrips(query)).toEqual(trips)
  })
  it('lists trips in departure order with sensible values', () => {
    expect(trips).toHaveLength(7)
    for (const t of trips) {
      expect(t.pricePerSeat % 10).toBe(0)
      expect(t.pricePerSeat).toBeGreaterThan(0)
      expect(t.durationMin).toBeGreaterThan(60)
      expect(t.seatsLeft).toBeGreaterThan(0)
    }
    expect(trips.map((t) => t.departMin)).toEqual([...trips.map((t) => t.departMin)].sort((a, b) => a - b))
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
  it('still prices a very short hop', () => {
    const near = generateTrips({ mode: 'bus', from: up('Savar'), to: up('Dhamrai'), date: query.date })
    expect(near[0].pricePerSeat).toBeGreaterThan(0)
  })
  it('gives a train coaches of 50 seats, with coach-prefixed Bangladesh-style seat numbers', () => {
    const trains = generateTrips(trainQuery)
    expect(trains.length).toBeGreaterThan(0)
    for (const train of trains) {
      expect(totalSeats(train)).toBe(50 * train.coaches.length)
      expect([...bookedSeatsFor(train)].every((k) => /^(UMA|JA|KA|KHA|GA|GHA|CHA)-[A-J][1-5]$/.test(k))).toBe(true)
    }
  })
  it('gives every class of one train the same departure time', () => {
    const byName = new Map()
    for (const t of generateTrips(trainQuery)) byName.set(t.operator, [...(byName.get(t.operator) ?? []), t.departMin])
    for (const times of byName.values()) expect(new Set(times).size).toBe(1)
  })
})

describe('stations and trains', () => {
  it('only lists trains that run along both stations\' line', () => {
    const names = trainsBetween(st('Kamalapur'), st('Chattogram')).map((t) => t.name)
    expect(names).toContain('Subarna Express')
    expect(names).not.toContain('Parabat Express') // that is the Sylhet line
    expect(trainsBetween(st('Kamalapur'), st('Sylhet')).map((t) => t.name)).toContain('Parabat Express')
  })
  it('connects Kamalapur to the main line stations and not to unconnected ones', () => {
    const reach = trainDestinations(st('Kamalapur'))
    for (const name of ['Chattogram', 'Sylhet', 'Rajshahi', 'Khulna Junction', 'Rangpur']) expect(reach.has(st(name))).toBe(true)
    expect(reach.has(st('Kamalapur'))).toBe(false)
  })
  it('does not connect stations on different lines', () => {
    expect(trainsBetween(st('Sylhet'), st('Rajshahi'))).toHaveLength(0)
  })
})

describe('districts', () => {
  const names = new Set(BUS_PLACES.map((p) => p.name))
  it('has all 64 districts next to their Sadar upazilas', () => {
    expect(DISTRICTS).toHaveLength(64)
    for (const n of ['Cumilla', 'Cumilla Adarsha Sadar', 'Dinajpur', 'Dinajpur Sadar', 'Dhaka', 'Chattogram', 'Rajshahi']) expect(names.has(n)).toBe(true)
  })
  it('sorts districts and upazilas together A to Z', () => {
    const list = BUS_PLACES.map((p) => p.name)
    expect(list.indexOf('Cumilla')).toBeLessThan(list.indexOf('Cumilla Adarsha Sadar'))
    expect(list.every((n, i) => i === 0 || n.localeCompare(list[i - 1], 'en', { sensitivity: 'base' }) >= 0)).toBe(true)
  })
  it('lets you book a bus between two districts', () => {
    const from = DISTRICTS.find((d) => d.name === 'Cumilla').id, to = DISTRICTS.find((d) => d.name === 'Dinajpur').id
    expect(generateTrips({ mode: 'bus', from, to, date: '2026-11-13' }).length).toBeGreaterThan(0)
  })
})

describe('place lists', () => {
  const sorted = (list) => list.every((p, i) => i === 0 || /[\u0980-\u09ff]/.test(p.name) || p.name.toLowerCase() >= list[i - 1].name.toLowerCase())
  it('has every upazila, sorted A to Z, with unique ids', () => {
    expect(UPAZILAS.length).toBeGreaterThanOrEqual(490)
    expect(sorted(UPAZILAS)).toBe(true)
    expect(new Set([...BUS_PLACES, ...STATIONS].map((p) => p.id)).size).toBe(BUS_PLACES.length + STATIONS.length)
  })
  it('puts every place inside Bangladesh', () => {
    for (const p of [...UPAZILAS, ...STATIONS]) {
      expect(p.lat).toBeGreaterThan(20.5)
      expect(p.lat).toBeLessThan(26.7)
      expect(p.lng).toBeGreaterThan(88)
      expect(p.lng).toBeLessThan(92.8)
    }
  })
})
