import { distanceKm } from '../lib/geo'
import { hashString, mulberry32 } from '../lib/random'
import { allSeatIds, seatKey } from '../lib/seats'
import { placeById } from './cities'
import { BUS_OPERATORS, TRAIN_CLASSES, firstTrainBetween, trainsBetween } from './operators'

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

/** "Dhaka Ml" and "Betona Com" are how the timetable abbreviates them. */
const trainLabel = (name) => name.replace(/ Ml$/, ' Mail').replace(/ Com(?= |$)/, ' Commuter')

/**
 * Road or rail distance in km.
 *  - Train: the real distance along the railway, from the timetable, for the first direct train of the day.
 *  - Bus: an estimate (straight line between the two places x 1.25), because there is no road network in the app.
 * A road and a railway never follow the same line, so one pair of places has two different, honest distances.
 */
export function routeKm(mode, from, to) {
  if (mode === 'train') {
    const direct = firstTrainBetween(from, to)
    if (direct) return Math.max(1, Math.round(direct.to[3] - direct.from[3]))
  }
  return Math.max(2, distanceKm(placeById(from), placeById(to)))
}

export function generateTrips({ mode, from, to, date }) {
  const config = MODES[mode]
  const km = routeKm(mode, from, to)
  const rng = mulberry32(hashString(`${mode}|${from}|${to}|${date}`))
  const minFare = mode === 'bus' ? 30 : 20

  /** One row per bookable thing: a bus, or a train in one class. */
  let services
  if (mode === 'bus') {
    const travelTime = () => Math.max(15, Math.round(((km / config.speedKmh) * 60 * (0.92 + rng() * 0.2)) / 5) * 5)
    services = Array.from({ length: config.count }, (_, i) => {
      const { name, cls, factor, amenities } = BUS_OPERATORS[Math.floor(rng() * BUS_OPERATORS.length)]
      return { operator: name, cls, factor, amenities, coaches: [''], departMin: departAt(i, config.count, rng), durationMin: travelTime(), km }
    })
  } else {
    // Real trains with their real times. A train leaves once a day, so every class shares the departure and the journey time.
    services = trainsBetween(from, to).flatMap(({ train, from: a, to: b }) => {
      const departMin = a[2]
      const durationMin = Math.max(5, (b[1] - a[2] + 1440) % 1440)
      const legKm = Math.max(1, Math.round(b[3] - a[3]))
      return train.classes.map((cls) => ({ operator: trainLabel(train.name), cls, ...TRAIN_CLASSES[cls], departMin, durationMin, km: legKm }))
    })
  }

  return services.map(({ operator, cls, factor, amenities, coaches, departMin, durationMin, km: tripKm }, i) => {
    const trip = {
      id: `${mode}-${from}-${to}-${date}-${i}`, mode, from, to, date,
      operator, cls, amenities,
      departMin, durationMin, arriveMin: departMin + durationMin, km: tripKm,
      pricePerSeat: Math.max(minFare, Math.round((tripKm * config.ratePerKm * factor) / 10) * 10),
      coaches: coaches ?? [], seatConfig: config.seatConfig,
    }
    return { ...trip, seatsLeft: totalSeats(trip) - bookedSeatsFor(trip).size }
  }).sort((x, y) => x.departMin - y.departMin)
}
