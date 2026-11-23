import { distanceKm } from '../lib/geo'
import { hashString, mulberry32 } from '../lib/random'
import { allSeatIds, seatKey } from '../lib/seats'
import { placeById } from './cities'
import { BUS_OPERATORS, TRAIN_CLASSES, trainsBetween } from './operators'

/** Bus and train names are real (see operators.js). Fares are about ৳4.6 per km by bus and ৳3.6 per km by train. */
export const MODES = {
  bus: { label: 'Bus', ratePerKm: 4.6, speedKmh: 48, count: 7, seatConfig: { rows: 10, layout: [2, 2] } },
  train: { label: 'Train', ratePerKm: 3.6, speedKmh: 62, seatConfig: { rows: 10, layout: [2, 3] } },
}

export const totalSeats = (trip) => allSeatIds(trip.seatConfig).length * trip.coaches.length

/** Keys of seats already taken. Pass a coach for one coach, or nothing for the whole trip. */
export function bookedSeatsFor(trip, coach) {
  const booked = new Set()
  const fill = 0.25 + (hashString(trip.id) % 50) / 100
  for (const c of coach === undefined ? trip.coaches : [coach]) {
    const rng = mulberry32(hashString(`${trip.id}|${c}`))
    for (const id of allSeatIds(trip.seatConfig)) if (rng() < fill) booked.add(seatKey(c, id))
  }
  return booked
}

const DAY_START = 5 * 60 // first departure is after 05:00
const DAY_SPAN = 18 * 60 // departures are spread over the next 18 hours

/** Departure time for the i-th of `count` services, with a little seeded jitter in 5-minute steps. */
const departAt = (i, count, rng) => {
  const slot = Math.floor(DAY_SPAN / Math.max(count, 1))
  return DAY_START + i * slot + Math.floor(rng() * Math.max((slot - 10) / 5, 1)) * 5
}

export function generateTrips({ mode, from, to, date }) {
  const config = MODES[mode]
  const km = Math.max(distanceKm(placeById(from), placeById(to)), 12) // very short hops still cost a minimum fare
  const rng = mulberry32(hashString(`${mode}|${from}|${to}|${date}`))
  const travelTime = () => Math.round(((km / config.speedKmh) * 60 * (0.92 + rng() * 0.2)) / 5) * 5

  /** One row per bookable thing: a bus, or a train in one class. */
  let services
  if (mode === 'bus') {
    services = Array.from({ length: config.count }, (_, i) => {
      const { name, cls, factor, amenities } = BUS_OPERATORS[Math.floor(rng() * BUS_OPERATORS.length)]
      return { operator: name, cls, factor, amenities, coaches: [''], departMin: departAt(i, config.count, rng), durationMin: travelTime() }
    })
  } else {
    // A train leaves once a day, so every class of that train shares the same departure and journey time.
    const trains = trainsBetween(from, to)
    services = trains.flatMap((train, i) => {
      const departMin = departAt(i, trains.length, rng)
      const durationMin = travelTime()
      return train.classes.map((cls) => ({ operator: train.name, cls, ...TRAIN_CLASSES[cls], departMin, durationMin }))
    })
  }

  return services.map(({ operator, cls, factor, amenities, coaches, departMin, durationMin }, i) => {
    const trip = {
      id: `${mode}-${from}-${to}-${date}-${i}`, mode, from, to, date,
      operator, cls, amenities,
      departMin, durationMin, arriveMin: departMin + durationMin,
      pricePerSeat: Math.round((km * config.ratePerKm * factor) / 10) * 10,
      coaches, seatConfig: config.seatConfig,
    }
    return { ...trip, seatsLeft: totalSeats(trip) - bookedSeatsFor(trip).size }
  })
}
