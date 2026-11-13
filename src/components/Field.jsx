import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const control = 'h-12 w-full rounded-xl border border-line bg-paper px-3.5 text-base transition-shadow focus:border-forest focus:ring-2 focus:ring-brass/50'

export function TextField({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <motion.input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.35 }}
        className={`${control} ${error ? 'border-danger' : ''}`} {...props} />
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}

export function SelectField({ id, label, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <select id={id} className={`${control} appearance-none pr-10`} {...props}>{children}</select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
      </div>
    </div>
  )
}
