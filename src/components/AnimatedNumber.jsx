import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

const defaultFormat = (n) => Math.round(n).toLocaleString('en-IN')

/** Counts up or down to the new value instead of jumping. */
export default function AnimatedNumber({ value, format = defaultFormat }) {
  const reduce = useReducedMotion()
  const motionValue = useMotionValue(value)
  const text = useTransform(motionValue, format)

  useEffect(() => {
    if (reduce) { motionValue.set(value); return undefined }
    const controls = animate(motionValue, value, { duration: 0.55, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [value, reduce, motionValue])

  return <motion.span>{text}</motion.span>
}
