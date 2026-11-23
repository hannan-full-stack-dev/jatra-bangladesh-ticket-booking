import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'
import { divisionName, placeById } from '@/data/cities'

const meta = (p) => (p.kind === 'district' ? `District, ${divisionName(p.division)}` : p.hint ? `near ${p.hint}, ${divisionName(p.division)}` : divisionName(p.division))
const initialOf = (name) => name.charAt(0).toUpperCase()

/**
 * A searchable list of places, sorted A to Z with the first letter as a section marker, like an index in a timetable.
 * `options` must already be sorted.
 */
export default function PlacePicker({ id, label, noun, value, options, onChange, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef(null)
  const input = useRef(null)
  const list = useRef(null)
  const selected = placeById(value)

  const q = query.trim().toLowerCase()
  const shown = useMemo(() => (q
    ? options.filter((p) => `${p.name} ${p.hint ?? ''} ${divisionName(p.division)}`.toLowerCase().includes(q))
    : options), [options, q])

  const close = () => { setOpen(false); setQuery('') }
  const choose = (place) => { onChange(place.id); close() }

  useEffect(() => {
    if (!open) return undefined
    const away = (e) => { if (!root.current?.contains(e.target)) close() }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  // preventScroll: focusing the search box must never move the page.
  useEffect(() => { if (open) input.current?.focus({ preventScroll: true }) }, [open])
  // Start on the current choice, and keep the highlighted row in view.
  useEffect(() => { if (open) setActive(Math.max(0, options.findIndex((p) => p.id === value))) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  // Scroll only the list itself. scrollIntoView() also scrolls the whole page, which made the page jump up when the menu opened.
  useEffect(() => {
    if (!open) return
    const box = list.current
    const row = document.getElementById(`${id}-opt-${active}`)
    if (!box || !row) return
    const b = box.getBoundingClientRect()
    const r = row.getBoundingClientRect()
    if (r.top < b.top) box.scrollTop -= b.top - r.top
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom
  }, [open, active, id])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, shown.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) choose(shown[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); close(); document.getElementById(id)?.focus() }
    else if (e.key === 'Tab') close()
  }

  return (
    <div ref={root} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <button id={id} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3.5 text-left text-base transition-colors hover:border-forest/40 focus:border-forest focus:ring-2 focus:ring-brass/50">
        <span className="min-w-0 truncate">{selected?.name}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-mute" aria-hidden="true" />
      </button>

      {open && (
        <div className={clsx('absolute z-30 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-paper shadow-lift', align === 'right' ? 'right-0' : 'left-0')}>
          <div className="flex items-center gap-2 border-b border-line px-3.5">
            <Search className="h-4 w-4 shrink-0 text-mute" aria-hidden="true" />
            <input ref={input} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0) }} onKeyDown={onKeyDown}
              role="combobox" aria-expanded="true" aria-controls={`${id}-list`} aria-activedescendant={shown[active] ? `${id}-opt-${active}` : undefined}
              aria-label={`Search ${noun}`} placeholder={`Search ${noun}`} autoComplete="off"
              className="h-11 w-full bg-transparent text-base outline-none placeholder:text-mute" />
            <span className="shrink-0 text-sm tabular-nums text-mute">{shown.length}</span>
          </div>
          <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-mute">No {noun} match “{query}”</li>}
            {shown.map((p, i) => {
              const newLetter = i === 0 || initialOf(shown[i - 1].name) !== initialOf(p.name)
              return (
                <li key={p.id} role="presentation">
                  {newLetter && <p aria-hidden="true" className="px-4 pb-1 pt-3 font-mono text-sm font-medium text-mute">{initialOf(p.name)}</p>}
                  <div id={`${id}-opt-${i}`} role="option" aria-selected={p.id === value} onClick={() => choose(p)} onMouseMove={() => setActive(i)}
                    className={clsx('flex h-9 cursor-pointer items-center gap-2 px-4', i === active && 'bg-ivory')}>
                    <span aria-hidden="true" className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', p.id === value ? 'bg-brass' : 'bg-transparent')} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 text-sm text-mute">{meta(p)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
