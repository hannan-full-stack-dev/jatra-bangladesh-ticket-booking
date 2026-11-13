import { useMemo } from 'react'
import { hashString, mulberry32 } from '@/lib/random'

const SIZE = 25

/** A QR-style code generated from the booking id. Decorative: it is not a scannable QR code. */
export default function Qr({ seed }) {
  const path = useMemo(() => {
    const rng = mulberry32(hashString(seed))
    const grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => rng() > 0.52))
    for (const [ox, oy] of [[0, 0], [SIZE - 7, 0], [0, SIZE - 7]]) {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const edge = i === 0 || j === 0 || i === 6 || j === 6
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4
        grid[oy + i][ox + j] = edge || core
      }
    }
    return grid.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join('')
  }, [seed])

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} shapeRendering="crispEdges" role="img" aria-label="Boarding code" className="h-28 w-28 text-ink">
      <path d={path} fill="currentColor" />
    </svg>
  )
}
