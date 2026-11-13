import { describe, expect, it } from 'vitest'
import { priceBooking } from './pricing'

describe('priceBooking', () => {
  it('adds a 2% service fee', () => {
    expect(priceBooking({ pricePerSeat: 1000, seatCount: 2 })).toMatchObject({ subtotal: 2000, serviceFee: 40, total: 2040 })
  })
  it('applies JATRA10 as 10% off the subtotal', () => {
    const price = priceBooking({ pricePerSeat: 1000, seatCount: 2, promo: ' jatra10 ' })
    expect(price.discount).toBe(200)
    expect(price.total).toBe(1840)
    expect(price.promoApplied).toBe(true)
  })
  it('flags an unknown code and charges full price', () => {
    const price = priceBooking({ pricePerSeat: 500, seatCount: 1, promo: 'NOPE' })
    expect(price.promoInvalid).toBe(true)
    expect(price.discount).toBe(0)
  })
  it('does not flag an empty code', () => {
    expect(priceBooking({ pricePerSeat: 500, seatCount: 1 }).promoInvalid).toBe(false)
  })
})
