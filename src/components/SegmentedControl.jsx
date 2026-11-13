import clsx from 'clsx'
import { motion } from 'framer-motion'

/** Pill switch. The highlight slides between options (shared layout animation). */
export default function SegmentedControl({ options, value, onChange, layoutId, label, tone = 'light' }) {
  const dark = tone === 'dark'
  return (
    <div role="radiogroup" aria-label={label}
      className={clsx('relative inline-flex rounded-full p-1', dark ? 'bg-ivory/10' : 'border border-line bg-ivory')}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.value)}
            className={clsx('relative z-10 flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors',
              active ? (dark ? 'text-ink' : 'text-ivory') : dark ? 'text-ivory/70 hover:text-ivory' : 'text-mute hover:text-ink')}>
            {active && (
              <motion.span layoutId={layoutId} transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={clsx('absolute inset-0 -z-10 rounded-full', dark ? 'bg-brass' : 'bg-forest')} />
            )}
            {o.icon}{o.label}
          </button>
        )
      })}
    </div>
  )
}
