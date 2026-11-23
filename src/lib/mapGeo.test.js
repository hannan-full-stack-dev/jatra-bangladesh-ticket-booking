import { describe, expect, it } from 'vitest'
import { DISTRICT_PATHS } from '@/data/bangladeshMap'
import { BUS_PLACES, STATIONS, UPAZILAS as UPAZILA_PLACES, placeById } from '@/data/cities'
import * as upa from '@/data/upazilaMap'
import { districtAt, locate, parseAbsolute, parseRelative } from './mapGeo'
import { project } from './geo'

describe('map data', () => {
  it('has all 64 districts, with the same ids as the places', () => {
    const ids = Object.keys(DISTRICT_PATHS)
    expect(ids).toHaveLength(64)
    for (const id of ids) expect(placeById(id)?.kind).toBe('district')
  })

  it('has an outline for every upazila, inside a district that exists', () => {
    for (const place of UPAZILA_PLACES) {
      const entry = upa.UPAZILAS[place.id]
      expect(entry, place.id).toBeDefined()
      expect(DISTRICT_PATHS[entry[0]], place.id).toBeDefined()
    }
    expect(Object.keys(upa.UPAZILAS)).toHaveLength(UPAZILA_PLACES.length)
  })

  it('reads both path formats back into rings', () => {
    expect(parseAbsolute('M1 2L3 4L5 6ZM7 8L9 10L11 12Z')).toEqual([[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10], [11, 12]]])
    expect(parseRelative('M10 20l1 2 -3 4zM0 0l5 5 5 -5z')).toEqual([[[10, 20], [11, 22], [8, 26]], [[0, 0], [5, 5], [10, 0]]])
  })
})

describe('locate', () => {
  it('puts a district in itself, with no upazila', () => {
    expect(locate(placeById('district-dinajpur'), upa)).toEqual({ district: 'district-dinajpur', upazila: null })
  })

  it('puts an upazila in its district', () => {
    expect(locate(placeById('dinajpur-sadar'), upa)).toEqual({ district: 'district-dinajpur', upazila: 'dinajpur-sadar' })
    expect(locate(placeById('savar'), upa).district).toBe('district-dhaka')
    expect(locate(placeById('cox-s-bazar-sadar'), upa).district).toBe('district-cox-s-bazar')
  })

  it('finds the upazila and district around a railway station', () => {
    const kamalapur = STATIONS.find((s) => s.name === 'Kamalapur')
    expect(locate(kamalapur, upa).district).toBe('district-dhaka')
  })

  it('finds the district without the upazila outlines too', () => {
    const p = project(placeById('savar'))
    expect(districtAt(p.x, p.y)).toBe('district-dhaka')
    expect(locate(placeById('savar'), null).district).toBe('district-dhaka')
  })

  it('finds a district for every place, even on the coast', () => {
    for (const place of [...BUS_PLACES, ...STATIONS]) {
      const { district } = locate(place, upa)
      expect(DISTRICT_PATHS[district], place.id).toBeDefined()
    }
  })
})
