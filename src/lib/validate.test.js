import { describe, expect, it } from 'vitest'
import { validateCheckout } from './validate'

const good = { passengers: [{ name: 'Hannan Goljar' }], contact: { phone: '01712-345678', email: '' } }

describe('validateCheckout', () => {
  it('accepts a complete form', () => expect(validateCheckout(good)).toEqual({}))
  it('flags a missing name and a bad phone, keyed by input id', () => {
    const errors = validateCheckout({ passengers: [{ name: ' ' }], contact: { phone: '123', email: '' } })
    expect(Object.keys(errors)).toEqual(['name-0', 'phone'])
  })
  it('only checks the email when one is given', () => {
    expect(validateCheckout({ ...good, contact: { phone: '01712345678', email: 'nope' } }).email).toBeTruthy()
  })
})
