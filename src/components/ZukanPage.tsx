import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, type Monster } from '../db'
import { byNoThenId, emptyFilter, matchesFilter } from '../lib/filter'
import { monsterName } from '../lib/monster'
import { Filters } from './Filters'
import { MonsterDetail } from './MonsterDetail'
import { MonsterForm } from './MonsterForm'
import { MonsterIcon } from './MonsterIcon'

interface Props {
  /** 指定すると選択モード。タップしたモンスターを返す。 */
  onPick?: (monster: Monster) => void
}

export function ZukanPage({ onPick }: Props) {
  const monsters = useLiveQuery(() => db.monsters.toArray(), [])
  const [filter, setFilter] = useState(emptyFilter)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<number>()

  if (adding) return <MonsterForm onDone={() => setAdding(false)} />
  if (openId !== undefined) return <MonsterDetail id={openId} onBack={() => setOpenId(undefined)} />

  const shown = monsters?.filter((m) => matchesFilter(m, filter)).sort(byNoThenId) ?? []

  return (
    <section>
      <div className="row between">
        <h2>{onPick ? '図鑑から選ぶ' : `図鑑 (${monsters?.length ?? 0})`}</h2>
        <button className="primary" onClick={() => setAdding(true)}>
          ＋ 図鑑に追加
        </button>
      </div>
      <Filters value={filter} onChange={setFilter} />
      {monsters && monsters.length === 0 && (
        <p className="empty">まだ図鑑が空です。ゲームの図鑑一覧のスクショから、アイコンを登録しましょう。名前は、あとで詳細画面の写真から読み取れます。</p>
      )}
      <ul className="tiles">
        {shown.map((m) => (
          <li key={m.id}>
            <button className="tile" onClick={() => (onPick ? onPick(m) : setOpenId(m.id))}>
              <MonsterIcon monster={m} />
              {m.no !== undefined && <span className="no">No.{m.no}</span>}
              <span className={`name ${m.name ? '' : 'unnamed'}`}>{monsterName(m)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
