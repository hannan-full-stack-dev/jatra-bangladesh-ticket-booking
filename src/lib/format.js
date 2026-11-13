const pad = (n) => String(n).padStart(2, '0')

export const formatMoney = (amount) => `৳${amount.toLocaleString('en-IN')}`

/** Minutes after midnight to "06:45 AM". Wraps past midnight. */
export function formatClock(minutes) {
  const total = ((minutes % 1440) + 1440) % 1440
  const hour = Math.floor(total / 60)
  return `${pad(hour % 12 || 12)}:${pad(total % 60)} ${hour < 12 ? 'AM' : 'PM'}`
}

export const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`

export const formatDate = (iso, options = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', options)

export const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}
