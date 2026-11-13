import { BUS_PLACES } from './busPlaces'
import { STATIONS } from './stations'
import { trainDestinations } from './operators'

/**
 * Everywhere you can book to.
 *  - By bus: every division (8), district (64) and upazila (544) of Bangladesh.
 *  - By train: every railway station (425) of Bangladesh Railway.
 * A place is { id, kind, name, bn, sub, div, lat, lng } and `div` is the id of its division.
 */
/** The eight divisions as places, at their divisional headquarters. */
const DIVISION_PLACES = [
  ['barishal', 'Barishal', 'বরিশাল', 22.701, 90.3535], ['chattogram', 'Chattogram', 'চট্টগ্রাম', 22.3569, 91.7832],
  ['dhaka', 'Dhaka', 'ঢাকা', 23.8103, 90.4125], ['khulna', 'Khulna', 'খুলনা', 22.8456, 89.5403],
  ['mymensingh', 'Mymensingh', 'ময়মনসিংহ', 24.7471, 90.4203], ['rajshahi', 'Rajshahi', 'রাজশাহী', 24.3636, 88.6241],
  ['rangpur', 'Rangpur', 'রংপুর', 25.7439, 89.2752], ['sylhet', 'Sylhet', 'সিলেট', 24.8949, 91.8687],
].map(([div, name, bn, lat, lng]) => ({ id: `v-${div}`, kind: 'division', name: `${name} Division`, bn, sub: 'Division', div, lat, lng }))

export const PLACES = { bus: [...DIVISION_PLACES, ...BUS_PLACES], train: STATIONS }

const BY_ID = new Map([...PLACES.bus, ...STATIONS].map((p) => [p.id, p]))
export const placeById = (id) => BY_ID.get(id)
/** Same thing under the name the booking screens already use. */
export const cityById = placeById

export const placesFor = (mode) => PLACES[mode]

/** All eight divisions of Bangladesh. */
export const DIVISIONS = [
  { id: 'rangpur', name: 'Rangpur' },
  { id: 'rajshahi', name: 'Rajshahi' },
  { id: 'mymensingh', name: 'Mymensingh' },
  { id: 'sylhet', name: 'Sylhet' },
  { id: 'dhaka', name: 'Dhaka' },
  { id: 'khulna', name: 'Khulna' },
  { id: 'barishal', name: 'Barishal' },
  { id: 'chattogram', name: 'Chattogram' },
]
export const divisionName = (id) => DIVISIONS.find((d) => d.id === id)?.name ?? ''

/** The route each mode starts on. */
export const DEFAULT_ROUTES = {
  bus: { from: 'd1', to: 'd43' }, // Dhaka to Chattogram
  train: { from: 'sda', to: 'sctg' }, // Kamalapur to Chattogram
}

/** Stations (or districts) you can reach from `from`. By train, the ones with a direct train come first. */
export const reachableFrom = (mode, from) => (mode === 'train' ? trainDestinations(from) : null)

export const POPULAR = [
  { from: 'd1', to: 'd43', mode: 'bus' },
  { from: 'sda', to: 'ssyl', mode: 'train' },
  { from: 'd1', to: 'd45', mode: 'bus' },
  { from: 'sda', to: 'srjq', mode: 'train' },
]
