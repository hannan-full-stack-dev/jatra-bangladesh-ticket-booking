export const SERVICE_FEE_RATE = 0.02
export const PROMOS = { JATRA10: { percent: 10 } }

export function priceBooking({ pricePerSeat, seatCount, promo = '' }) {
  const subtotal = pricePerSeat * seatCount
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE)
  const code = promo.trim().toUpperCase()
  const found = code ? PROMOS[code] : undefined
  const discount = found ? Math.round((subtotal * found.percent) / 100) : 0
  return {
    subtotal,
    serviceFee,
    discount,
    total: subtotal + serviceFee - discount,
    promoApplied: Boolean(found),
    promoInvalid: Boolean(code) && !found,
  }
}
