import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db, type OwnedMonster } from '../db'
import { emptyFilter, matchesFilter } from '../lib/filter'
import { Filters } from './Filters'
import { MonsterIcon } from './MonsterIcon'
import { OwnedEditor } from './OwnedEditor'
import { ZukanPage } from './ZukanPage'

type Sort = 'new' | 'no' | 'luck'

export function OwnedPage() {
  const owned = useLiveQuery(() => db.owned.toArray(), [])
  const zukan = useLiveQuery(() => db.zukan.toArray(), [])
  const byNo = useMemo(() => new Map(zukan?.map((z) => [z.no, z])), [zukan])
  const [filter, setFilter] = useState(emptyFilter)
  const [sort, setSort] = useState<Sort>('new')
  const [favOnly, setFavOnly] = useState(false)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState<OwnedMonster>()

  if (picking)
    return (
      <>
        <button onClick={() => setPicking(false)}>← 所持一覧に戻る</button>
        <ZukanPage
          onPick={async (entry) => {
            const id = await db.owned.add({ no: entry.no, luck: 1, favorite: false, memo: '', createdAt: Date.now() })
            setPicking(false)
            setEditing(await db.owned.get(id))
          }}
        />
      </>
    )
  if (editing) return <OwnedEditor owned={editing} entry={byNo.get(editing.no)} onDone={() => setEditing(undefined)} />

  const shown = (owned ?? [])
    .filter((o) => (!favOnly || o.favorite) && matchesFilter(byNo.get(o.no), filter))
    .sort((a, b) =>
      sort === 'no' ? a.no - b.no : sort === 'luck' ? b.luck - a.luck : b.createdAt - a.createdAt,
    )
  const maxLuck = owned?.filter((o) => o.luck === 99).length ?? 0

  return (
    <section>
      <div className="row between">
        <h2>
          所持 ({owned?.length ?? 0}) <small>運極 {maxLuck}</small>
        </h2>
        <button className="primary" onClick={() => setPicking(true)}>
          ＋ 所持を追加
        </button>
      </div>
      <Filters value={filter} onChange={setFilter} />
      <div className="row">
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="new">追加が新しい順</option>
          <option value="no">図鑑No.順</option>
          <option value="luck">ラックが高い順</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} />
          お気に入りのみ
        </label>
      </div>
      {owned && owned.length === 0 && <p className="empty">「所持を追加」から図鑑のモンスターを選んで登録します。</p>}
      <ul className="tiles">
        {shown.map((o) => {
          const entry = byNo.get(o.no)
          return (
            <li key={o.id}>
              <div className="tile">
                <button className="tile-main" onClick={() => setEditing(o)}>
                  <MonsterIcon entry={entry} />
                  <span className={`luck ${o.luck === 99 ? 'max' : ''}`}>{o.luck === 99 ? '運極' : `ラック${o.luck}`}</span>
                  <span className="name">{entry?.name ?? `No.${o.no}`}</span>
                </button>
                <button
                  className={`fav ${o.favorite ? 'on' : ''}`}
                  aria-label="お気に入り"
                  onClick={() => db.owned.update(o.id, { favorite: !o.favorite })}
                >
                  ★
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
