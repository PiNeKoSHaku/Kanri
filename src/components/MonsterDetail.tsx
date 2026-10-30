import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { MonsterForm } from './MonsterForm'
import { MonsterIcon } from './MonsterIcon'
import { PhotoAdder } from './PhotoAdder'

interface Props {
  id: number
  onBack: () => void
}

/** 図鑑のアイコンを押したときの詳細画面。追加した写真を表示する。 */
export function MonsterDetail({ id, onBack }: Props) {
  const monster = useLiveQuery(() => db.monsters.get(id), [id])
  const photos = useLiveQuery(() => db.photos.where('monsterId').equals(id).sortBy('createdAt'), [id])
  const ownedCount = useLiveQuery(() => db.owned.where('monsterId').equals(id).count(), [id])
  const [mode, setMode] = useState<'view' | 'edit' | 'photo'>('view')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState<number>()

  if (monster === undefined) return null
  if (monster === null || !db.isOpen()) return <button onClick={onBack}>← 図鑑に戻る</button>
  if (mode === 'edit') return <MonsterForm monster={monster} onDone={() => setMode('view')} />
  if (mode === 'photo')
    return (
      <PhotoAdder
        monster={monster}
        onDone={(notice) => {
          if (notice) setMessage(notice)
          setMode('view')
        }}
      />
    )

  const addOwned = async () => {
    await db.owned.add({ monsterId: id, luck: 1, favorite: false, memo: '', createdAt: Date.now() })
    setMessage('所持に追加しました（所持タブで確認できます）')
  }
  const remove = async () => {
    if (ownedCount) return setMessage(`所持に ${ownedCount} 体いるので削除できません。先に所持から外してください。`)
    await db.transaction('rw', db.monsters, db.photos, async () => {
      await db.photos.where('monsterId').equals(id).delete()
      await db.monsters.delete(id)
    })
    onBack()
  }

  const info = [
    monster.no !== undefined && `No.${monster.no}`,
    monster.element && `${monster.element}属性`,
    monster.rarity && `★${monster.rarity}`,
  ].filter(Boolean)

  return (
    <section className="detail">
      <button onClick={onBack}>← 図鑑に戻る</button>
      <div className="row">
        <MonsterIcon monster={monster} size={88} />
        <div>
          <h2>{monster.name}</h2>
          <div className="hint">{info.length ? info.join(' / ') : 'No.・属性は未設定（詳細画面の写真を追加すると読み取ります）'}</div>
        </div>
      </div>
      <div className="row">
        <button className="primary" onClick={() => setMode('photo')}>
          ＋ 写真を追加
        </button>
        <button onClick={addOwned}>所持に追加</button>
        <button onClick={() => setMode('edit')}>編集</button>
      </div>
      {message && <p className="ok">{message}</p>}
      {photos && photos.length === 0 && (
        <p className="empty">まだ写真がありません。ゲームの詳細画面のスクショを追加できます。</p>
      )}
      <div className="photos">
        {photos?.map((p) => (
          <figure key={p.id}>
            <img src={p.image} alt={`${monster.name}の写真`} />
            {deletingPhoto === p.id ? (
              <div className="row end">
                <button onClick={() => setDeletingPhoto(undefined)}>やめる</button>
                <button
                  className="danger"
                  onClick={async () => {
                    await db.photos.delete(p.id)
                    setDeletingPhoto(undefined)
                  }}
                >
                  この写真を削除
                </button>
              </div>
            ) : (
              <button onClick={() => setDeletingPhoto(p.id)}>写真を削除</button>
            )}
          </figure>
        ))}
      </div>
      <div className="row end">
        {confirmDelete ? (
          <button className="danger" onClick={remove}>
            本当に図鑑から削除
          </button>
        ) : (
          <button onClick={() => setConfirmDelete(true)}>図鑑から削除</button>
        )}
      </div>
    </section>
  )
}
