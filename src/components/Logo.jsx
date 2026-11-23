/** A curved route with two stops, and the word "journey" in Bangla. */
export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#0F3D2E" />
        <path d="M8 22 C 12 8, 20 24, 24 10" fill="none" stroke="#C8A24A" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="8" cy="22" r="2.4" fill="#F6F1E7" />
        <circle cx="24" cy="10" r="2.4" fill="#F6F1E7" />
      </svg>
      <span className="font-display text-xl font-medium">Jatra</span>
      <span className="hidden text-sm font-medium text-brass-dark sm:inline">যাত্রা</span>
    </span>
  )
}
