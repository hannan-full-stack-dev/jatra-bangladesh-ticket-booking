import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Lock, Smartphone } from 'lucide-react'
import Button from '@/components/Button'
import { TextField } from '@/components/Field'
import FareBreakdown from '@/components/FareBreakdown'
import HoldRing from '@/components/HoldRing'
import { placeById } from '@/data/cities'
import { useHoldTimer } from '@/hooks/useHoldTimer'
import { createBooking } from '@/lib/booking'
import { formatClock, formatDate, formatMoney } from '@/lib/format'
import { priceBooking } from '@/lib/pricing'
import { validateCheckout } from '@/lib/validate'
import { useBooking } from '@/state/BookingContext'

const PAYMENTS = [
  { id: 'bkash', label: 'bKash', hint: 'Mobile wallet', icon: Smartphone },
  { id: 'nagad', label: 'Nagad', hint: 'Mobile wallet', icon: Smartphone },
  { id: 'card', label: 'Card', hint: 'Visa or Mastercard', icon: CreditCard },
]

export default function CheckoutScreen() {
  const [state, dispatch] = useBooking()
  const { trip, seats, passengers, contact, promo, payment, holdStartedAt } = state
  const [errors, setErrors] = useState({})
  const [paying, setPaying] = useState(false)
  const [promoDraft, setPromoDraft] = useState(promo)
  const payTimer = useRef()
  useEffect(() => () => clearTimeout(payTimer.current), [])

  const remaining = useHoldTimer(holdStartedAt, () => dispatch({ type: 'EXPIRE' }))
  const price = priceBooking({ pricePerSeat: trip.pricePerSeat, seatCount: seats.length, promo })

  function submit(e) {
    e.preventDefault()
    const found = validateCheckout({ passengers, contact })
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) return document.getElementById(firstInvalid)?.focus()
    setPaying(true)
    // Demo only: a real app would call a payment provider here.
    payTimer.current = setTimeout(() => dispatch({ type: 'CONFIRM', booking: createBooking(state) }), 1300)
  }

  return (
    <section aria-labelledby="checkout-title">
      <Button variant="ghost" className="mb-5 min-h-10 px-4 text-sm" onClick={() => dispatch({ type: 'GO', step: 'seats' })}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Change seats
      </Button>
      <h1 id="checkout-title" className="font-display text-4xl tracking-tight md:text-5xl">Who is travelling?</h1>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <form id="checkout-form" onSubmit={submit} noValidate className="grid gap-6">
          <fieldset className="rounded-3xl border border-line bg-paper p-6 shadow-lift">
            <legend className="sr-only">Passengers</legend>
            <h2 className="mb-4 font-display text-2xl">Passengers</h2>
            <div className="grid gap-4">
              {passengers.map((p, i) => (
                <motion.div key={seats[i]} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="grid items-start gap-3 sm:grid-cols-[88px_1fr]">
                  <div className="mt-7 grid h-12 place-items-center rounded-xl bg-brass-soft font-semibold text-brass-dark">{seats[i]}</div>
                  <TextField id={`name-${i}`} label={`Passenger ${i + 1} full name`} autoComplete="name" value={p.name}
                    error={errors[`name-${i}`]} onChange={(e) => dispatch({ type: 'SET_PASSENGER', index: i, name: e.target.value })} />
                </motion.div>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-line bg-paper p-6 shadow-lift">
            <legend className="sr-only">Contact</legend>
            <h2 className="mb-4 font-display text-2xl">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="01712-345678"
                value={contact.phone} error={errors.phone} onChange={(e) => dispatch({ type: 'SET_CONTACT', field: 'phone', value: e.target.value })} />
              <TextField id="email" label="Email (optional)" type="email" autoComplete="email" value={contact.email}
                error={errors.email} onChange={(e) => dispatch({ type: 'SET_CONTACT', field: 'email', value: e.target.value })} />
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-line bg-paper p-6 shadow-lift">
            <legend className="sr-only">Payment method</legend>
            <h2 className="mb-4 font-display text-2xl">Payment</h2>
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-3">
              {PAYMENTS.map(({ id, label, hint, icon: Icon }) => {
                const active = payment === id
                return (
                  <button key={id} type="button" role="radio" aria-checked={active} onClick={() => dispatch({ type: 'SET_PAYMENT', payment: id })}
                    className={clsx('relative rounded-2xl border p-4 text-left transition-colors', active ? 'border-transparent' : 'border-line hover:border-forest/40')}>
                    {active && <motion.span layoutId="pay-ring" transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-2xl border-2 border-forest bg-forest/5" />}
                    <span className="relative flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" aria-hidden="true" />{label}</span>
                    <span className="relative mt-0.5 block text-xs text-mute">{hint}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-mute"><Lock className="h-3.5 w-3.5" aria-hidden="true" />Demo checkout: no payment is taken.</p>
          </fieldset>
        </form>

        <aside className="rounded-3xl border border-line bg-paper p-6 shadow-lift lg:sticky lg:top-24" aria-label="Order summary">
          <p className="text-sm text-mute">{trip.operator} · {trip.cls}</p>
          <h2 className="font-display text-2xl">{placeById(trip.from).name} → {placeById(trip.to).name}</h2>
          <p className="mt-1 text-sm text-mute">{formatDate(trip.date)} · {formatClock(trip.departMin)} · {seats.join(', ')}</p>
          <div className="my-5"><HoldRing remaining={remaining} /></div>

          <div className="mb-5">
            <label htmlFor="promo" className="mb-1.5 block text-sm font-medium">Promo code</label>
            <div className="flex gap-2">
              <input id="promo" value={promoDraft} onChange={(e) => setPromoDraft(e.target.value)} placeholder="Try JATRA10"
                className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3.5 uppercase focus:border-forest focus:ring-2 focus:ring-brass/50" />
              <Button type="button" variant="ghost" className="min-h-11 px-4" onClick={() => dispatch({ type: 'SET_PROMO', code: promoDraft.trim().toUpperCase() })}>Apply</Button>
            </div>
            <p role="status" className={clsx('mt-1.5 text-sm', price.promoInvalid ? 'text-danger' : 'text-forest-light')}>
              {price.promoApplied && 'Promo applied: 10% off.'}{price.promoInvalid && 'That code is not valid.'}
            </p>
          </div>

          <FareBreakdown price={price} seatCount={seats.length} />
          <Button type="submit" form="checkout-form" variant="brass" className="mt-6 w-full" loading={paying}>
            {paying ? 'Confirming…' : `Pay ${formatMoney(price.total)}`}
          </Button>
        </aside>
      </div>
    </section>
  )
}
