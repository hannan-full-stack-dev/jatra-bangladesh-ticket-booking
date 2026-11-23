import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-forest text-ivory hover:bg-forest-light',
  brass: 'bg-brass text-ink hover:bg-[#D3AE57]',
  ghost: 'border border-line bg-paper text-ink hover:border-forest/40',
}

export default function Button({ variant = 'primary', loading = false, className, children, disabled, ...props }) {
  const blocked = disabled || loading
  return (
    <motion.button
      whileTap={blocked ? undefined : { scale: 0.97 }}
      disabled={blocked}
      className={clsx('group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none', VARIANTS[variant], className)}
      {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  )
}
