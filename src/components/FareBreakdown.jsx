import AnimatedNumber from './AnimatedNumber'
import { formatMoney } from '@/lib/format'

const money = (n) => formatMoney(Math.round(n))

export default function FareBreakdown({ price, seatCount }) {
  const rows = [
    [`Fare × ${seatCount}`, price.subtotal],
    ['Service fee (2%)', price.serviceFee],
    ...(price.discount ? [['Promo JATRA10', -price.discount]] : []),
  ]
  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-mute">{label}</dt>
          <dd className={`tabular-nums ${value < 0 ? 'text-forest-light' : ''}`}><AnimatedNumber value={value} format={money} /></dd>
        </div>
      ))}
      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-medium">Total</dt>
        <dd className="font-display text-3xl tabular-nums"><AnimatedNumber value={price.total} format={money} /></dd>
      </div>
    </dl>
  )
}
