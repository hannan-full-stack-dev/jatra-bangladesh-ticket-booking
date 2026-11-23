import { STATION_ROWS } from './places'

/**
 * Real bus companies and real Bangladesh Railway intercity trains.
 * Only the names are real. Departure times, fares, stops and seat availability are generated for this demo.
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
  'AC Seat': { factor: 1.45, amenities: ['ac', 'charge'], coaches: ['UMA', 'JA'] },
  Snigdha: { factor: 1.2, amenities: ['ac'], coaches: ['KA', 'KHA'] },
  'Shovan Chair': { factor: 0.55, amenities: [], coaches: ['GA', 'GHA', 'CHA'] },
}

/**
 * Rail lines as waypoints [lat, lng] (real station positions). A station counts as "on a line" when it is within
 * CORRIDOR_KM of it. This is a geometric estimate, not Bangladesh Railway's stoppage list.
 */
const P = {
  dhaka: [23.732, 90.426], tongi: [23.899, 90.408], ghorashal: [23.938, 90.634], bhairab: [24.05, 90.978],
  brahmanbaria: [23.967, 91.109], akhaura: [23.869, 91.206], cumilla: [23.464, 91.167], feni: [23.013, 91.403],
  chattogram: [22.334, 91.83], dohazari: [22.163, 92.069], coxsBazar: [21.429, 92.015],
  shaistaganj: [24.278, 91.45], sreemangal: [24.307, 91.735], maijgaon: [24.686, 91.952], sylhet: [24.882, 91.868],
  joydebpur: [23.998, 90.42], tangail: [24.274, 89.938], saidabad: [24.396, 89.733], ishwardi: [24.13, 89.063],
  abdulpur: [24.26, 88.972], rajshahi: [24.375, 88.609], poradaha: [23.865, 89.033], jashore: [23.17, 89.21],
  khulna: [22.841, 89.543], bogura: [24.849, 89.367], gaibandha: [25.33, 89.53], rangpur: [25.728, 89.264],
  lalmonirhat: [25.912, 89.445], mymensingh: [24.753, 90.41],
}
const route = (...names) => names.map((n) => P[n])
const BASE = ['dhaka', 'tongi', 'ghorashal', 'bhairab']
const LINES = {
  chattogram: route(...BASE, 'brahmanbaria', 'akhaura', 'cumilla', 'feni', 'chattogram'),
  sylhet: route(...BASE, 'brahmanbaria', 'akhaura', 'shaistaganj', 'sreemangal', 'maijgaon', 'sylhet'),
  chattogramSylhet: route('chattogram', 'feni', 'cumilla', 'akhaura', 'shaistaganj', 'sreemangal', 'maijgaon', 'sylhet'),
  coxsBazar: route('chattogram', 'dohazari', 'coxsBazar'),
  rajshahi: route('dhaka', 'tongi', 'joydebpur', 'tangail', 'saidabad', 'ishwardi', 'abdulpur', 'rajshahi'),
  khulna: route('dhaka', 'tongi', 'joydebpur', 'tangail', 'saidabad', 'ishwardi', 'poradaha', 'jashore', 'khulna'),
  khulnaRajshahi: route('khulna', 'jashore', 'poradaha', 'ishwardi', 'abdulpur', 'rajshahi'),
  rangpur: route('dhaka', 'tongi', 'joydebpur', 'tangail', 'saidabad', 'bogura', 'gaibandha', 'rangpur'),
  lalmonirhat: route('dhaka', 'tongi', 'joydebpur', 'tangail', 'saidabad', 'bogura', 'gaibandha', 'rangpur', 'lalmonirhat'),
  mymensingh: route('dhaka', 'tongi', 'joydebpur', 'mymensingh'),
}
const CORRIDOR_KM = 6
const ALL = ['AC Seat', 'Snigdha', 'Shovan Chair']
const SOME = ['Snigdha', 'Shovan Chair']

/** Real Bangladesh Railway intercity trains, each on the line it runs along. */
export const TRAINS = [
  { name: 'Subarna Express', line: 'chattogram', classes: ALL },
  { name: 'Sonar Bangla Express', line: 'chattogram', classes: ALL },
  { name: 'Mahanagar Provati', line: 'chattogram', classes: SOME },
  { name: 'Mahanagar Godhuli', line: 'chattogram', classes: SOME },
  { name: 'Turna Express', line: 'chattogram', classes: ALL },
  { name: 'Parabat Express', line: 'sylhet', classes: ALL },
  { name: 'Jayantika Express', line: 'sylhet', classes: SOME },
  { name: 'Upaban Express', line: 'sylhet', classes: SOME },
  { name: 'Kalni Express', line: 'sylhet', classes: SOME },
  { name: 'Paharika Express', line: 'chattogramSylhet', classes: SOME },
  { name: 'Udayan Express', line: 'chattogramSylhet', classes: SOME },
  { name: 'Cox’s Bazar Express', line: 'coxsBazar', classes: SOME },
  { name: 'Dolonchapa Express', line: 'coxsBazar', classes: SOME },
  { name: 'Silk City Express', line: 'rajshahi', classes: ALL },
  { name: 'Padma Express', line: 'rajshahi', classes: SOME },
  { name: 'Banalata Express', line: 'rajshahi', classes: SOME },
  { name: 'Dhumketu Express', line: 'rajshahi', classes: SOME },
  { name: 'Sundarban Express', line: 'khulna', classes: ALL },
  { name: 'Chitra Express', line: 'khulna', classes: SOME },
  { name: 'Kapotakkha Express', line: 'khulnaRajshahi', classes: SOME },
  { name: 'Rangpur Express', line: 'rangpur', classes: ALL },
  { name: 'Lalmoni Express', line: 'lalmonirhat', classes: SOME },
  { name: 'Agnibina Express', line: 'mymensingh', classes: SOME },
  { name: 'Tista Express', line: 'mymensingh', classes: SOME },
  { name: 'Brahmaputra Express', line: 'mymensingh', classes: SOME },
]

/** Kilometres from a point to the nearest part of a path (flat-earth maths, fine at this scale). */
function distanceToPathKm([lat, lng], path) {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180)
  const ky = 110.57
  let best = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    const ax = (path[i][1] - lng) * kx, ay = (path[i][0] - lat) * ky
    const bx = (path[i + 1][1] - lng) * kx, by = (path[i + 1][0] - lat) * ky
    const len2 = (bx - ax) ** 2 + (by - ay) ** 2
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * (bx - ax) + ay * (by - ay)) / len2))
    best = Math.min(best, Math.hypot(ax + t * (bx - ax), ay + t * (by - ay)))
  }
  return best
}

let stationTrains // station id -> Set of train indexes, built once
function trainsAt(id) {
  if (!stationTrains) {
    stationTrains = new Map()
    for (const [sid, , lat, lng] of STATION_ROWS) {
      const on = new Set()
      TRAINS.forEach((t, i) => { if (distanceToPathKm([lat, lng], LINES[t.line]) <= CORRIDOR_KM) on.add(i) })
      stationTrains.set(sid, on)
    }
  }
  return stationTrains.get(id) ?? new Set()
}

/** Ids of stations that at least one train passes. */
export const trainStationIds = () => STATION_ROWS.map((r) => r[0]).filter((id) => trainsAt(id).size > 0)

/** Trains that serve both stations, in either direction. */
export function trainsBetween(from, to) {
  const a = trainsAt(from), b = trainsAt(to)
  return TRAINS.filter((_, i) => a.has(i) && b.has(i))
}

/** Ids of the stations you can reach by a direct train from this station. */
export function trainDestinations(from) {
  const ids = new Set()
  const mine = trainsAt(from)
  for (const [sid] of STATION_ROWS) {
    if (sid === from) continue
    const theirs = trainsAt(sid)
    for (const i of mine) if (theirs.has(i)) { ids.add(sid); break }
  }
  return ids
}
