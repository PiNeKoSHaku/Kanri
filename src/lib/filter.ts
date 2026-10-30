import type { Element, Monster } from '../db'

export interface FilterState {
  query: string
  element: Element | null
}

export const emptyFilter: FilterState = { query: '', element: null }

export function matchesFilter(monster: Monster | undefined, f: FilterState): boolean {
  if (f.element && monster?.element !== f.element) return false
  const q = f.query.trim()
  if (!q) return true
  if (!monster) return false
  return monster.name.includes(q) || String(monster.no) === q
}

/** 図鑑No.の順。No.が未入力のものは後ろに、登録順で並べる。 */
export function byNoThenId(a: Monster, b: Monster): number {
  return (a.no ?? Infinity) - (b.no ?? Infinity) || a.id - b.id
}
