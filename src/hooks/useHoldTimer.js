import { useEffect, useRef, useState } from 'react'

export const HOLD_SECONDS = 300

/** Seconds left on the seat hold, or null when nothing is held. Calls onExpire once at zero. */
export function useHoldTimer(holdStartedAt, onExpire) {
  const [now, setNow] = useState(() => Date.now())
  const expire = useRef(onExpire)
  expire.current = onExpire

  useEffect(() => {
    if (!holdStartedAt) return undefined
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [holdStartedAt])

  const remaining = holdStartedAt ? Math.max(0, HOLD_SECONDS - Math.floor((now - holdStartedAt) / 1000)) : null
  useEffect(() => { if (remaining === 0) expire.current() }, [remaining])
  return remaining
}
