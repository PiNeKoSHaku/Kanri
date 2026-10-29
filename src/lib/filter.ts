import type { Element, ZukanEntry } from '../db'

export interface FilterState {
  query: string
  element: Element | null
}

export const emptyFilter: FilterState = { query: '', element: null }

export function matchesFilter(entry: ZukanEntry | undefined, f: FilterState): boolean {
  if (f.element && entry?.element !== f.element) return false
  const q = f.query.trim()
  if (!q) return true
  if (!entry) return false
  return entry.name.includes(q) || String(entry.no) === q
}
