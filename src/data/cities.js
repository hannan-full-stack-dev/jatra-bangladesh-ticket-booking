import { trainDestinations, trainStationIds } from './operators'
import { DISTRICT_ROWS, DIVISION_IDS, STATION_ROWS, UPAZILA_ROWS } from './places'

/** The eight divisions. `label` is where the name sits on the map. */
export const DIVISIONS = [
  { id: 'rangpur', name: 'Rangpur', label: { lng: 89.5, lat: 25.92 } },
  { id: 'rajshahi', name: 'Rajshahi', label: { lng: 89.0, lat: 24.7 } },
  { id: 'mymensingh', name: 'Mymensingh', label: { lng: 90.3, lat: 25.02 } },
  { id: 'sylhet', name: 'Sylhet', label: { lng: 91.6, lat: 24.65 } },
  { id: 'dhaka', name: 'Dhaka', label: { lng: 89.85, lat: 23.65 } },
  { id: 'khulna', name: 'Khulna', label: { lng: 89.3, lat: 23.25 } },
  { id: 'barishal', name: 'Barishal', label: { lng: 90.2, lat: 22.2 } },
  { id: 'chattogram', name: 'Chattogram', label: { lng: 92.05, lat: 23.2 } },
]
export const divisionName = (id) => DIVISIONS.find((d) => d.id === id)?.name ?? id

/** A place you can travel from or to. Buses run between districts and upazilas, trains between railway stations. */
const toPlace = (kind) => ([id, name, lat, lng, division, hint]) => ({ id, name, lat, lng, kind, division: DIVISION_IDS[division], hint })

/** Both lists come sorted A to Z. */
export const UPAZILAS = UPAZILA_ROWS.map(toPlace('upazila'))
export const DISTRICTS = DISTRICT_ROWS.map(toPlace('district'))
export const STATIONS = STATION_ROWS.map(toPlace('station'))

/** Every place a bus can go: all 64 districts and every upazila (so both "Cumilla" and "Cumilla Adarsha Sadar"), A to Z. */
export const BUS_PLACES = [...DISTRICTS, ...UPAZILAS].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

const BY_ID = new Map([...BUS_PLACES, ...STATIONS].map((p) => [p.id, p]))
export const placeById = (id) => BY_ID.get(id)

let railStations
const stationsWithTrains = () => (railStations ??= (() => { const ok = new Set(trainStationIds()); return STATIONS.filter((s) => ok.has(s.id)) })())

/** Every place you can pick in this mode, A to Z. */
export const placesFor = (mode) => (mode === 'train' ? stationsWithTrains() : BUS_PLACES)
export const isPlaceFor = (mode, id) => placesFor(mode).some((p) => p.id === id)

/** Places you can reach from `from`. By train, only stations that share a real train line with it. */
export function destinationsFor(mode, from) {
  if (mode === 'bus') return BUS_PLACES.filter((p) => p.id !== from)
  const reach = trainDestinations(from)
  return stationsWithTrains().filter((s) => reach.has(s.id))
}

const idOf = (list, name, fallback) => (list.find((p) => p.name === name) ?? list[fallback]).id
export const DEFAULT_ROUTES = {
  bus: { from: idOf(UPAZILAS, 'Savar', 0), to: idOf(UPAZILAS, 'Cox’s Bazar Sadar'.replace('’', "'"), 1) },
  train: { from: idOf(STATIONS, 'Kamalapur', 0), to: idOf(STATIONS, 'Chattogram', 1) },
}

const pick = (list, name) => idOf(list, name, 0)
export const POPULAR = [
  { mode: 'train', from: pick(STATIONS, 'Kamalapur'), to: pick(STATIONS, 'Chattogram') },
  { mode: 'train', from: pick(STATIONS, 'Kamalapur'), to: pick(STATIONS, 'Sylhet') },
  { mode: 'train', from: pick(STATIONS, 'Kamalapur'), to: pick(STATIONS, 'Rajshahi') },
  { mode: 'bus', from: pick(UPAZILAS, 'Savar'), to: pick(UPAZILAS, "Cox's Bazar Sadar") },
  { mode: 'bus', from: pick(UPAZILAS, 'Gazipur Sadar'), to: pick(UPAZILAS, 'Sylhet Sadar') },
]
