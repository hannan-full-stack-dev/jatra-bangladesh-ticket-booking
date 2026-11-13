export const MAX_SEATS = 4
const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Bangladesh style: the row is a letter and the seat is a number, A1 A2 | A3 A4, then B1 B2 | B3 B4 ... */
const idsFor = (letter, from, to) => Array.from({ length: to - from }, (_, i) => `${letter}${from + i + 1}`)

/** { rows: 10, layout: [2, 2] } becomes [{ row: 'A', left: ['A1','A2'], right: ['A3','A4'] }, { row: 'B', ... }, ...] */
export function buildSeatGrid({ rows, layout: [left, right] }) {
  return Array.from({ length: rows }, (_, i) => ({
    row: ROW_LETTERS[i],
    left: idsFor(ROW_LETTERS[i], 0, left),
    right: idsFor(ROW_LETTERS[i], left, left + right),
  }))
}

export const allSeatIds = (config) => buildSeatGrid(config).flatMap((r) => [...r.left, ...r.right])

/** Train seats belong to a coach: "KA-B3". Bus seats have no coach: "B3". */
export const seatKey = (coach, id) => (coach ? `${coach}-${id}` : id)

/** Returns the new selection and, when nothing changed, the reason why. */
export function toggleSeat(selected, key, { booked, max = MAX_SEATS }) {
  if (booked.has(key)) return { selected, reason: 'booked' }
  if (selected.includes(key)) return { selected: selected.filter((k) => k !== key) }
  if (selected.length >= max) return { selected, reason: 'limit' }
  return { selected: [...selected, key] }
}
