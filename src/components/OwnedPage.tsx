import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db, type OwnedMonster } from '../db'
import { emptyFilter, matchesFilter } from '../lib/filter'
import { monsterName } from '../lib/monster'
import { Filters } from './Filters'
import { MonsterIcon } from './MonsterIcon'
import { OwnedEditor } from './OwnedEditor'
import { ZukanPage } from './ZukanPage'

type Sort = 'new' | 'no' | 'luck'

export function OwnedPage() {
  const owned = useLiveQuery(() => db.owned.toArray(), [])
  const monsters = useLiveQuery(() => db.monsters.toArray(), [])
  const byId = useMemo(() => new Map(monsters?.map((m) => [m.id, m])), [monsters])
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
          onPick={async (monster) => {
            const id = await db.owned.add({ monsterId: monster.id, luck: 1, favorite: false, memo: '', createdAt: Date.now() })
            setPicking(false)
            setEditing(await db.owned.get(id))
          }}
        />
      </>
    )
  if (editing) return <OwnedEditor owned={editing} monster={byId.get(editing.monsterId)} onDone={() => setEditing(undefined)} />

  const shown = (owned ?? [])
    .filter((o) => (!favOnly || o.favorite) && matchesFilter(byId.get(o.monsterId), filter))
    .sort((a, b) =>
      sort === 'no' ? noOf(a) - noOf(b) : sort === 'luck' ? b.luck - a.luck : b.createdAt - a.createdAt,
    )
  const noOf = (o: OwnedMonster) => byId.get(o.monsterId)?.no ?? Infinity
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
          const monster = byId.get(o.monsterId)
          return (
            <li key={o.id}>
              <div className="tile">
                <button className="tile-main" onClick={() => setEditing(o)}>
                  <MonsterIcon monster={monster} />
                  <span className={`luck ${o.luck === 99 ? 'max' : ''}`}>{o.luck === 99 ? '運極' : `ラック${o.luck}`}</span>
                  <span className="name">{monster ? monsterName(monster) : '（図鑑に無い）'}</span>
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
