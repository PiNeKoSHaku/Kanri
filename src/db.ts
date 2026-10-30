import Dexie, { type EntityTable } from 'dexie'

export const ELEMENTS = ['火', '水', '木', '光', '闇'] as const
export type Element = (typeof ELEMENTS)[number]

/** 図鑑の1体。登録に必須なのは名前と、一覧に出すアイコンだけ。 */
export interface Monster {
  id: number
  name: string
  /** 一覧に出すアイコン。JPEGのdata URL。iOS SafariはIndexedDBへのBlob保存に失敗することがあるので文字列で持つ。 */
  icon: string
  /** 図鑑No.。詳細画面の写真から読み取るか、手入力で足す。 */
  no?: number
  element?: Element
  rarity?: number
  createdAt: number
}

/** 図鑑の1体に付ける詳細画面などの写真（不要な部分は切り取り済み）。 */
export interface Photo {
  id: number
  monsterId: number
  /** JPEGのdata URL */
  image: string
  createdAt: number
}

/** 所持モンスター1体。同じモンスターを複数持てる。 */
export interface OwnedMonster {
  id: number
  monsterId: number
  luck: number
  favorite: boolean
  memo: string
  createdAt: number
}

export const db = new Dexie('kanri') as Dexie & {
  monsters: EntityTable<Monster, 'id'>
  photos: EntityTable<Photo, 'id'>
  owned: EntityTable<OwnedMonster, 'id'>
}

db.version(1).stores({
  zukan: 'no, name, element, rarity',
  owned: '++id, no, luck, favorite',
})

// v2: 図鑑No.をキーにするのをやめ、名前とアイコンだけで登録できるようにする。
// 古い図鑑は、No.をそのままidにして引き継ぐ（所持の参照もそのまま通る）。
db.version(2)
  .stores({
    zukan: 'no, name, element, rarity',
    monsters: '++id, no, name',
    photos: '++id, monsterId',
    owned: '++id, monsterId, luck, favorite',
  })
  .upgrade(async (tx) => {
    const old = await tx.table('zukan').toArray()
    await tx.table('monsters').bulkAdd(
      old.map((z) => ({
        id: z.no,
        no: z.no,
        name: z.name,
        element: z.element,
        rarity: z.rarity,
        // 以前の版でBlobとして保存されたアイコンは引き継げない
        icon: typeof z.icon === 'string' ? z.icon : '',
        createdAt: z.createdAt,
      })),
    )
    await tx
      .table('owned')
      .toCollection()
      .modify((o) => {
        o.monsterId = o.no
        delete o.no
      })
  })

db.version(3).stores({ zukan: null })
