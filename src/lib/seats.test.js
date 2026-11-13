import { describe, expect, it } from 'vitest'
import { buildSeatGrid, seatKey, toggleSeat } from './seats'

describe('buildSeatGrid', () => {
  it('builds a 2+3 layout', () => {
    const [row] = buildSeatGrid({ rows: 2, layout: [2, 3] })
    expect(row.left).toEqual(['A1', 'A2'])
    expect(row.right).toEqual(['A3', 'A4', 'A5'])
  })
  it('numbers a 2+2 bus the Bangladesh way: A1 A2 A3 A4, then B1 B2 B3 B4', () => {
    const grid = buildSeatGrid({ rows: 3, layout: [2, 2] })
    expect(grid.flatMap((r) => [...r.left, ...r.right])).toEqual(['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'])
    expect(grid.map((r) => r.row)).toEqual(['A', 'B', 'C'])
  })
})

describe('seatKey', () => {
  it('prefixes the coach only when there is one', () => {
    expect(seatKey('KA', 'B3')).toBe('KA-B3')
    expect(seatKey('', 'B3')).toBe('B3')
  })
})

describe('toggleSeat', () => {
  const booked = new Set(['A1'])
  it('adds and removes a seat', () => {
    expect(toggleSeat([], 'B1', { booked }).selected).toEqual(['B1'])
    expect(toggleSeat(['B1'], 'B1', { booked }).selected).toEqual([])
  })
  it('refuses a taken seat', () => {
    expect(toggleSeat([], 'A1', { booked })).toEqual({ selected: [], reason: 'booked' })
  })
  it('stops at the seat limit', () => {
    const result = toggleSeat(['A2', 'A3', 'A4', 'B1'], 'B2', { booked })
    expect(result.reason).toBe('limit')
    expect(result.selected).toHaveLength(4)
  })
})
