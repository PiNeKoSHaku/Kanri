import Dexie, { type EntityTable } from 'dexie'

export const ELEMENTS = ['火', '水', '木', '光', '闇'] as const
export type Element = (typeof ELEMENTS)[number]

/** 図鑑の1エントリ。スクショから切り出したアイコンを持つ。 */
export interface ZukanEntry {
  no: number
  name: string
  element: Element
  rarity: number
  icon: Blob
  createdAt: number
}

/** 所持モンスター1体。同じ図鑑No.を複数持てる。 */
export interface OwnedMonster {
  id: number
  no: number
  luck: number
  favorite: boolean
  memo: string
  createdAt: number
}

export const db = new Dexie('kanri') as Dexie & {
  zukan: EntityTable<ZukanEntry, 'no'>
  owned: EntityTable<OwnedMonster, 'id'>
}

db.version(1).stores({
  zukan: 'no, name, element, rarity',
  owned: '++id, no, luck, favorite',
})
