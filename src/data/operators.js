import { TRAIN_SERVICES } from './trainServices'

/**
 * Real bus companies and the real Bangladesh Railway timetable.
 * Bus departures, fares and seat availability are generated for this demo. Train names, stops and times are real; train fares and seats are generated.
 */

/** One entry per company and class. Several departures a day by the same company are normal. */
export const BUS_OPERATORS = [
  { name: 'Green Line Paribahan', cls: 'AC Sleeper', factor: 1.4, amenities: ['ac', 'wifi', 'charge', 'recline'] },
  { name: 'Green Line Paribahan', cls: 'AC Business', factor: 1.15, amenities: ['ac', 'wifi', 'charge'] },
  { name: 'Hanif Enterprise', cls: 'AC Business', factor: 1.05, amenities: ['ac', 'charge'] },
  { name: 'Hanif Enterprise', cls: 'Non-AC', factor: 0.62, amenities: ['charge'] },
  { name: 'Shyamoli Paribahan', cls: 'AC Business', factor: 1.05, amenities: ['ac', 'charge'] },
  { name: 'Shyamoli Paribahan', cls: 'Non-AC', factor: 0.6, amenities: [] },
  { name: 'S. Alam Service', cls: 'AC Sleeper', factor: 1.35, amenities: ['ac', 'wifi', 'charge', 'recline'] },
  { name: 'S. Alam Service', cls: 'AC Business', factor: 1.1, amenities: ['ac', 'charge'] },
  { name: 'Ena Transport', cls: 'AC Business', factor: 1.1, amenities: ['ac', 'wifi', 'charge'] },
  { name: 'Soudia Air Condition', cls: 'AC Business', factor: 1.05, amenities: ['ac', 'charge'] },
  { name: 'National Travels', cls: 'AC Business', factor: 1, amenities: ['ac', 'charge'] },
  { name: 'National Travels', cls: 'Non-AC', factor: 0.6, amenities: [] },
  { name: 'Saintmartin Paribahan', cls: 'AC Business', factor: 1.05, amenities: ['ac', 'wifi', 'charge'] },
  { name: 'Shohagh Paribahan', cls: 'AC Business', factor: 1, amenities: ['ac', 'charge'] },
  { name: 'Shohagh Paribahan', cls: 'Non-AC', factor: 0.6, amenities: [] },
  { name: 'Desh Travels', cls: 'AC Business', factor: 1, amenities: ['ac', 'charge'] },
]

/** Train classes. Coach codes follow Bangladesh Railway (KA, KHA, GA ...). */
export const TRAIN_CLASSES = {
  'AC Berth': { factor: 2.1, amenities: ['ac', 'charge', 'recline'], coaches: ['BA', 'BHA'] },
  'AC Seat': { factor: 1.45, amenities: ['ac', 'charge'], coaches: ['UMA', 'JA'] },
  'First Class': { factor: 1.0, amenities: ['charge'], coaches: ['KA', 'KHA'] },
  Snigdha: { factor: 1.2, amenities: ['ac'], coaches: ['KA', 'KHA'] },
  'Shovan Chair': { factor: 0.55, amenities: [], coaches: ['GA', 'GHA', 'CHA'] },
  Shovan: { factor: 0.4, amenities: [], coaches: ['GA', 'GHA', 'CHA'] },
}

/**
 * The real Bangladesh Railway timetable: 224 trains and where each one stops, with the real arrival and departure
 * times and the distance from its first station. Source: github.com/hussain-ahmed2/bd-railway-data (MIT).
 */
const STOP = { code: 0, arrive: 1, depart: 2, km: 3 }

/** station id -> [{ train, at }] for every train that stops there. */
const AT_STATION = new Map()
for (const train of TRAIN_SERVICES) {
  train.stops.forEach((stop, at) => {
    const id = `s${stop[STOP.code].toLowerCase()}`
    if (!AT_STATION.has(id)) AT_STATION.set(id, [])
    AT_STATION.get(id).push({ train, at })
  })
}

/** Trains that run from `from` to `to` in that direction, each with its own stop at either end. */
export function trainsBetween(from, to) {
  const found = []
  for (const { train, at } of AT_STATION.get(from) ?? []) {
    const toAt = train.stops.findIndex((s, i) => i > at && `s${s[STOP.code].toLowerCase()}` === to)
    if (toAt !== -1) found.push({ train, from: train.stops[at], to: train.stops[toAt] })
  }
  return found
}

/** Ids of the stations you can reach on a direct train from this station. */
export function trainDestinations(from) {
  const ids = new Set()
  for (const { train, at } of AT_STATION.get(from) ?? []) {
    for (let i = at + 1; i < train.stops.length; i++) ids.add(`s${train.stops[i][STOP.code].toLowerCase()}`)
  }
  return ids
}

/** Whether any train stops at this station at all. */
export const hasTrains = (id) => AT_STATION.has(id)

/**
 * The direct train that leaves first in the day. The distance, the times and the line drawn on the map all come from this one
 * train, so the numbers on screen always match the route you can see.
 */
export function firstTrainBetween(from, to) {
  return trainsBetween(from, to).sort((x, y) => x.from[STOP.depart] - y.from[STOP.depart])[0] ?? null
}

/** Station ids from the start to the end of a `trainsBetween` result, along that train's real stops in order. */
export function trainPath({ train, from, to }) {
  return train.stops.slice(train.stops.indexOf(from), train.stops.indexOf(to) + 1).map((stop) => `s${stop[STOP.code].toLowerCase()}`)
}
