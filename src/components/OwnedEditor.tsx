import { useState } from 'react'
import { db, type Monster, type OwnedMonster } from '../db'
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

  const save = async () => {
    await db.owned.update(owned.id, { luck, memo })
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
          <strong>{monster?.name ?? '（図鑑に無い）'}</strong>
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
      <label className="field">
        <span>メモ（わくわくの実、用途など）</span>
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
