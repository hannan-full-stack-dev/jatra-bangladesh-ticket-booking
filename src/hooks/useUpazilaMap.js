import { useEffect, useState } from 'react'

let loaded
/** The upazila outlines are a big file, so they load on their own once the first screen is up. null until they have. */
export function useUpazilaMap() {
  const [upa, setUpa] = useState(loaded ?? null)
  useEffect(() => {
    if (loaded) return undefined
    let alive = true
    import('@/data/upazilaMap').then((mod) => { loaded = mod; if (alive) setUpa(mod) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return upa
}
