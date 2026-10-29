import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, type ZukanEntry } from '../db'
import { emptyFilter, matchesFilter } from '../lib/filter'
import { Filters } from './Filters'
import { MonsterIcon } from './MonsterIcon'
import { ZukanForm } from './ZukanForm'

interface Props {
  /** 指定すると選択モード。タップしたエントリを返す。 */
  onPick?: (entry: ZukanEntry) => void
}

export function ZukanPage({ onPick }: Props) {
  const entries = useLiveQuery(() => db.zukan.orderBy('no').toArray(), [])
  const [filter, setFilter] = useState(emptyFilter)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ZukanEntry>()

  if (adding) return <ZukanForm onDone={() => setAdding(false)} />
  if (editing) return <ZukanForm entry={editing} onDone={() => setEditing(undefined)} />

  const shown = entries?.filter((e) => matchesFilter(e, filter)) ?? []

  return (
    <section>
      <div className="row between">
        <h2>{onPick ? '図鑑から選ぶ' : `図鑑 (${entries?.length ?? 0})`}</h2>
        <button className="primary" onClick={() => setAdding(true)}>
          ＋ 図鑑に追加
        </button>
      </div>
      <Filters value={filter} onChange={setFilter} />
      {entries && entries.length === 0 && (
        <p className="empty">まだ図鑑が空です。ゲームの図鑑画面のスクショから追加しましょう。</p>
      )}
      <ul className="tiles">
        {shown.map((e) => (
          <li key={e.no}>
            <button className="tile" onClick={() => (onPick ? onPick(e) : setEditing(e))}>
              <MonsterIcon entry={e} />
              <span className="no">No.{e.no}</span>
              <span className="name">{e.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
