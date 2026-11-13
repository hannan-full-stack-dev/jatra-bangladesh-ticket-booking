import { motion } from 'framer-motion'

const COLORS = ['#C8A24A', '#0F3D2E', '#F0E4C3', '#1B5A44']
const COUNT = 24

/** A short burst of paper pieces. Positions come from the index, so it looks the same every time. */
export default function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2
        const distance = 90 + (i % 4) * 35
        return (
          <motion.span key={i} className="absolute h-2 w-2 rounded-sm" style={{ background: COLORS[i % 4] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance * 0.8 + 30, opacity: 0, scale: 0.6, rotate: 180 + i * 30 }}
            transition={{ duration: 1.1 + (i % 3) * 0.2, ease: 'easeOut', delay: 0.5 }} />
        )
      })}
    </div>
  )
}
