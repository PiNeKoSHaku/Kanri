import type { Element, Fruit, Monster } from '../db'

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

/** 所持の絞り込み。検索の文字は、モンスターの名前・No.に加えて、つけている実の名前にも合う。 */
export function matchesOwnedFilter(monster: Monster | undefined, fruits: Fruit[] | undefined, f: FilterState): boolean {
  if (f.element && monster?.element !== f.element) return false
  const q = f.query.trim()
  if (!q) return true
  return matchesFilter(monster, { ...f, element: null }) || !!fruits?.some((x) => x.name.includes(q))
}
