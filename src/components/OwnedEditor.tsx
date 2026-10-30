import { useState } from 'react'
import { db, type Fruit, type Monster, type OwnedMonster } from '../db'
import { FruitSlot } from './FruitSlot'
import { MAX_FRUIT_SLOTS } from '../lib/fruits'
import { monsterName } from '../lib/monster'
import { MonsterIcon } from './MonsterIcon'

interface Props {
  owned: OwnedMonster
  monster: Monster | undefined
  onDone: () => void
}

export function OwnedEditor({ owned, monster, onDone }: Props) {
  const [luck, setLuck] = useState(owned.luck)
  const [memo, setMemo] = useState(owned.memo)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // 実の枠。まだ何もつけていなければ、空の枠を2つ出す（獣神化したキャラの枠の数）
  const [fruits, setFruits] = useState<Fruit[]>(owned.fruits?.length ? owned.fruits : [{ name: '' }, { name: '' }])

  const save = async () => {
    await db.owned.update(owned.id, { luck, memo, fruits: fruits.filter((f) => f.name.trim()).map((f) => ({ ...f, name: f.name.trim() })) })
    onDone()
  }
  const remove = async () => {
    await db.owned.delete(owned.id)
    onDone()
  }

  return (
    <div className="panel">
      <div className="row">
        <MonsterIcon monster={monster} size={72} />
        <div>
          {monster?.no !== undefined && <div className="no">No.{monster.no}</div>}
          <strong>{monster ? monsterName(monster) : '（図鑑に無い）'}</strong>
        </div>
      </div>
      <label className="field">
        <span>ラック {luck === 99 ? '（運極）' : ''}</span>
        <div className="row">
          <input type="range" min={1} max={99} value={luck} onChange={(e) => setLuck(Number(e.target.value))} />
          <input
            className="num"
            inputMode="numeric"
            value={luck}
            onChange={(e) => setLuck(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
          />
          <button type="button" onClick={() => setLuck(99)}>
            運極
          </button>
        </div>
      </label>
      <fieldset className="field">
        <span>わくわくの実（{fruits.filter((f) => f.name.trim()).length}/{fruits.length}枠）</span>
        {fruits.map((f, i) => (
          <FruitSlot
            key={i}
            index={i}
            fruit={f}
            onChange={(next) => setFruits((all) => all.map((x, j) => (j === i ? next : x)))}
            onRemove={() => setFruits((all) => all.filter((_, j) => j !== i))}
          />
        ))}
        {fruits.length < MAX_FRUIT_SLOTS && (
          <button type="button" onClick={() => setFruits((all) => [...all, { name: '' }])}>
            ＋ 枠を追加
          </button>
        )}
      </fieldset>
      <label className="field">
        <span>メモ（用途など）</span>
        <textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} />
      </label>
      <div className="row between">
        {confirmDelete ? (
          <button type="button" className="danger" onClick={remove}>
            本当に削除
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)}>
            削除
          </button>
        )}
        <div className="row">
          <button type="button" onClick={onDone}>
            キャンセル
          </button>
          <button type="button" className="primary" onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
