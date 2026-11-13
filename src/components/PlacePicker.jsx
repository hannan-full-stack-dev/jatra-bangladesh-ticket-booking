import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Check, ChevronDown, Landmark, MapPin, Search, TrainFront, X, Zap } from 'lucide-react'
import clsx from 'clsx'
import { divisionName, placeById, placesFor } from '@/data/cities'
import { hasTrains } from '@/data/operators'

const MAX_RESULTS = 120
/** The grey line under a place name. The division is left out where a heading already says it. */
function placeLine(place, withDivision) {
  const division = `${divisionName(place.div)} Division`
  if (place.kind === 'division') return 'Division'
  if (place.kind === 'district') return withDivision ? `District · ${division}` : 'District'
  if (place.kind === 'upazila') return withDivision ? `${place.sub} · ${division}` : place.sub
  const district = place.sub ? `${place.sub} district` : 'Railway station'
  return withDivision && place.sub !== divisionName(place.div) ? `${district} · ${division}` : district
}

/** True on a phone-width screen, where the picker is a bottom sheet instead of a dropdown. */
function usePhone() {
  const query = '(max-width: 639px)'
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

const squash = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '')

/** Rank a place against a search: names that start with it first, then names that contain it, then district, code and Bangla. */
function score(place, q, raw) {
  const name = squash(place.name)
  if (name === q) return 0
  if (name.startsWith(q)) return 1
  if (name.includes(q)) return 2
  if (squash(place.sub).includes(q) || place.code?.toLowerCase() === raw) return 3
  if (place.bn && place.bn.replace(/\s+/g, '').includes(raw.replace(/\s+/g, ''))) return 3
  return -1
}

/** The place name with the part you typed picked out in brass. */
function Highlight({ text, query }) {
  if (!query) return text
  const at = text.toLowerCase().indexOf(query.toLowerCase().trim())
  if (at === -1 || !query.trim()) return text
  const end = at + query.trim().length
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-brass-soft px-px text-ink">{text.slice(at, end)}</mark>
      {text.slice(end)}
    </>
  )
}

function KindIcon({ place, className }) {
  if (place.kind === 'division') return <Landmark className={className} aria-hidden="true" />
  if (place.kind === 'district') return <Building2 className={className} aria-hidden="true" />
  if (place.kind === 'upazila') return <MapPin className={className} aria-hidden="true" />
  return <TrainFront className={className} aria-hidden="true" />
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={clsx('shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        active ? 'border-forest bg-forest text-ivory' : 'border-line bg-paper text-mute hover:border-forest/40 hover:text-ink')}>
      {children}
    </button>
  )
}

/**
 * Searchable place picker. A bus rider picks from every district and upazila, a train rider from every railway station.
 * `direct` (a Set of ids) marks the stations that have a direct train from the other end of the journey.
 */
export default function PlacePicker({ id, label, mode, value, onChange, exclude, direct, icon: Icon = MapPin }) {
  const uid = useId()
  const listId = `${uid}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all') // bus: all | district | upazila
  const [onlyDirect, setOnlyDirect] = useState(false)
  const [active, setActive] = useState(0)
  const triggerRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const listRef = useRef(null)
  const deferred = useDeferredValue(query)
  const phone = usePhone()

  const selected = placeById(value)
  const raw = deferred.trim().toLowerCase()
  const q = squash(deferred)

  const { groups, flat } = useMemo(() => {
    let pool = placesFor(mode).filter((p) => p.id !== exclude)
    if (kind !== 'all') pool = pool.filter((p) => p.kind === kind)
    if (onlyDirect && direct) pool = pool.filter((p) => direct.has(p.id))

    if (q) {
      const ranked = pool.map((p) => [score(p, q, raw), p]).filter(([s]) => s >= 0)
        .sort((a, b) => a[0] - b[0] || (direct?.has(b[1].id) ? 1 : 0) - (direct?.has(a[1].id) ? 1 : 0) || a[1].name.localeCompare(b[1].name))
      const items = ranked.slice(0, MAX_RESULTS).map(([, p]) => p)
      return { groups: [{ key: 'results', title: `${ranked.length} ${ranked.length === 1 ? 'match' : 'matches'}`, items }], flat: items }
    }

    // Everything runs A to Z, under a heading for each letter.
    const az = (list) => [...list].sort((x, y) => x.name.localeCompare(y.name, 'en', { sensitivity: 'base' }))
    const out = []
    let rest = pool
    if (direct && !onlyDirect) {
      const quick = az(pool.filter((p) => direct.has(p.id)))
      if (quick.length) {
        out.push({ key: 'direct', title: 'Direct trains from here (A–Z)', accent: true, items: quick })
        const ids = new Set(quick.map((p) => p.id))
        rest = pool.filter((p) => !ids.has(p.id))
      }
    }
    const byLetter = new Map()
    for (const p of az(rest)) {
      const letter = p.name[0].toUpperCase()
      if (!byLetter.has(letter)) byLetter.set(letter, [])
      byLetter.get(letter).push(p)
    }
    for (const [letter, items] of byLetter) out.push({ key: `letter-${letter}`, title: letter, items })
    return { groups: out, flat: out.flatMap((g) => g.items) }
  }, [mode, exclude, kind, onlyDirect, direct, q, raw])

  // Keep the highlighted row valid as the list changes.
  useEffect(() => { setActive(0) }, [q, kind, onlyDirect, open])

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }
  const choose = (place) => { onChange(place.id); close() }

  const openPicker = () => {
    setQuery(''); setKind('all'); setOnlyDirect(false); setOpen(true)
  }

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus({ preventScroll: true })
    const onDown = (e) => { if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) close(false) }
    document.addEventListener('pointerdown', onDown)
    // The sheet covers the page on a phone, so stop the page scrolling underneath it.
    const previous = document.body.style.overflow
    if (phone) document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('pointerdown', onDown); document.body.style.overflow = previous }
  }, [open, phone])

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (flat[active]) choose(flat[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Tab') close(false)
  }

  let index = -1
  const total = placesFor(mode).length

  return (
    <div className="relative">
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium">{label}</span>
      <button ref={triggerRef} id={id} type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-label ${id}`}
        onClick={() => (open ? close(false) : openPicker())}
        className={clsx('group flex h-[68px] w-full items-center gap-3 rounded-2xl border bg-paper px-3 text-left transition-all',
          open ? 'border-forest shadow-glow' : 'border-line hover:border-forest/40 hover:shadow-lift')}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-brass-soft">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-xl leading-tight">{selected?.name ?? 'Choose a place'}</span>
          <span className="block truncate text-xs text-mute">
            {selected ? placeLine(selected, false) : 'Search by name'}
          </span>
        </span>
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-mute transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {/* On a phone the sheet is portalled to <body>: an animated ancestor would otherwise make `fixed` relative to itself. */}
      {(phone ? (node) => createPortal(node, document.body) : (node) => node)(
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true"
              className="fixed inset-0 z-40 bg-forest-deep/50 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none" />
            <motion.div ref={panelRef} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[28px] border border-line bg-paper shadow-[0_-20px_60px_-20px_rgba(10,42,32,.45)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-[460px] sm:w-[min(420px,calc(100vw-2rem))] sm:rounded-2xl sm:shadow-lift">
              <div className="border-b border-line bg-ivory/60 px-4 pb-3 pt-4">
                <div className="mb-3 flex items-center justify-between sm:hidden">
                  <p className="font-display text-xl">{label}</p>
                  <button type="button" onClick={() => close()} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
                  <input ref={inputRef} type="text" role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
                    aria-activedescendant={flat[active] ? `${uid}-opt-${active}` : undefined} aria-label={`Search ${mode === 'bus' ? 'divisions, districts and upazilas' : 'stations'}`}
                    value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} autoComplete="off" spellCheck="false"
                    placeholder={mode === 'bus' ? 'Search division, district or upazila' : 'Search railway station'}
                    className="h-11 w-full rounded-xl border border-line bg-paper pl-10 pr-10 text-base focus:border-forest focus:ring-2 focus:ring-brass/50" />
                  {query && (
                    <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus() }}
                      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-mute hover:bg-ivory">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]" role="group" aria-label="Filters">
                  {mode === 'bus' ? (
                    <>
                      <Chip active={kind === 'all'} onClick={() => setKind('all')}>All</Chip>
                      <Chip active={kind === 'division'} onClick={() => setKind('division')}>Division</Chip>
                      <Chip active={kind === 'district'} onClick={() => setKind('district')}>District</Chip>
                      <Chip active={kind === 'upazila'} onClick={() => setKind('upazila')}>Upazila</Chip>
                    </>
                  ) : (
                    <>
                      <Chip active={!onlyDirect} onClick={() => setOnlyDirect(false)}>All</Chip>
                      {direct && <Chip active={onlyDirect} onClick={() => setOnlyDirect(true)}>Direct</Chip>}
                    </>
                  )}
                </div>
              </div>

              <div ref={listRef} id={listId} role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
                {flat.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Search className="mx-auto mb-3 h-7 w-7 text-mute" aria-hidden="true" />
                    <p className="font-display text-xl">Nothing called “{query.trim()}”</p>
                    <p className="mt-1 text-sm text-mute">Check the spelling, or clear a filter.</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.key} role="group" aria-label={group.title}>
                      <p className={clsx('sticky top-0 z-10 flex items-center gap-1.5 border-b border-line/70 bg-paper/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur',
                        group.accent ? 'text-brass-dark' : 'text-mute')}>
                        {group.accent && <Zap className="h-3 w-3" aria-hidden="true" />}
                        {group.title}
                        <span className="ml-auto font-medium tabular-nums tracking-normal text-mute/80">{group.items.length}</span>
                      </p>
                      <ul>
                        {group.items.map((place) => {
                          index += 1
                          const i = index
                          const isActive = i === active
                          const isSelected = place.id === value
                          const isDirect = direct?.has(place.id)
                          const noService = mode === 'train' && !hasTrains(place.id)
                          return (
                            <li key={place.id} id={`${uid}-opt-${i}`} data-index={i} role="option" aria-selected={isSelected}
                              onPointerMove={() => active !== i && setActive(i)} onClick={() => choose(place)}
                              className={clsx('mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2', isActive ? 'bg-ivory' : '', noService && 'opacity-60')}>
                              <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg border',
                                isSelected ? 'border-forest bg-forest text-brass-soft' : 'border-line bg-paper text-forest')}>
                                <KindIcon place={place} className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-baseline gap-2">
                                  <span className="truncate text-[15px] font-semibold"><Highlight text={place.name} query={deferred} /></span>
                                  {place.bn && <span className="truncate font-sans text-xs text-mute">{place.bn}</span>}
                                </span>
                                <span className="block truncate text-xs text-mute">{placeLine(place, Boolean(q) || group.key === 'direct')}</span>
                              </span>
                              {place.jn && <span className="shrink-0 rounded-md bg-forest/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">Jn</span>}
                              {isDirect && !onlyDirect && group.key !== 'direct' && (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-brass-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brass-dark"><Zap className="h-2.5 w-2.5" aria-hidden="true" />Direct</span>
                              )}
                              {noService && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-mute">No trains</span>}
                              {isSelected && <Check className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))
                )}
                {q && flat.length >= MAX_RESULTS && <p className="px-4 pt-3 text-center text-xs text-mute">Showing the first {MAX_RESULTS}. Type more to narrow it.</p>}
              </div>
              <p className="hidden border-t border-line bg-ivory/60 px-4 py-2 text-[11px] text-mute sm:block">
                {total.toLocaleString('en-IN')} {mode === 'bus' ? 'divisions, districts & upazilas' : 'railway stations'} · <kbd className="font-sans">↑↓</kbd> to move, <kbd className="font-sans">Enter</kbd> to pick
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      )}
    </div>
  )
}
