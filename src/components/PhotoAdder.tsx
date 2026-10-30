import { useCallback, useState } from 'react'
import { db, type Monster } from '../db'
import { detectElement, isDetailScreen, readDetailText } from '../lib/detailScreen'
import { cropPhotoToDataUrl, loadImage, type PhotoRect } from '../lib/image'
import { PhotoCropper } from './PhotoCropper'

interface Props {
  monster: Monster
  /** 写真を追加したあと（キャンセルなら引数なし）。名前の候補は、読み取れたときだけ渡す。 */
  onDone: (notice?: string, nameCandidates?: string[]) => void
}

/** 詳細画面などの写真を選び、不要な部分を切り取って、このモンスターに追加する */
export function PhotoAdder({ monster, onDone }: Props) {
  const [image, setImage] = useState<HTMLImageElement>()
  const [rect, setRect] = useState<PhotoRect>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onRect = useCallback((r: PhotoRect) => setRect(r), [])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      setImage(await loadImage(file))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const save = async () => {
    if (!image || !rect) return setError('写真を選んでください')
    setBusy(true)
    setError('')
    try {
      await db.photos.add({
        monsterId: monster.id,
        image: cropPhotoToDataUrl(image, rect),
        createdAt: Date.now(),
      })
    } catch (e) {
      setBusy(false)
      return setError(`保存できませんでした: ${(e as Error).message}`)
    }
    // モンスター詳細画面の写真なら、空いている図鑑No.・属性・名前を自動で読み取る（失敗しても写真は保存済み）
    let notice = '写真を追加しました'
    let nameCandidates: string[] | undefined
    const needNo = monster.no === undefined
    const needName = !monster.name
    if (isDetailScreen(image) && (needNo || monster.element === undefined || needName)) {
      try {
        const patch: Partial<Monster> = {}
        const element = monster.element === undefined ? detectElement(image) : undefined
        if (element) patch.element = element
        const text = await readDetailText(image, { no: needNo, name: needName })
        if (text.no) patch.no = text.no
        if (text.names.length) nameCandidates = text.names
        if (Object.keys(patch).length) await db.monsters.update(monster.id, patch)
        const found = [patch.no && `No.${patch.no}`, patch.element && `${patch.element}属性`, nameCandidates && '名前の候補']
        if (found.some(Boolean)) notice += `（${found.filter(Boolean).join('・')}を読み取りました）`
      } catch {
        // 読み取りに失敗しても、あとから手入力できる
      }
    }
    onDone(notice, nameCandidates)
  }

  return (
    <div className="panel">
      <h2>写真を追加</h2>
      <label className="field">
        <span>スクショ・写真</span>
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {image && <PhotoCropper key={image.src} image={image} onChange={onRect} />}
      {error && <p className="error">{error}</p>}
      {busy && <p className="hint">保存しています…（詳細画面なら、図鑑No.・属性・名前も読み取ります）</p>}
      <div className="row end">
        <button type="button" onClick={() => onDone()} disabled={busy}>
          キャンセル
        </button>
        <button type="button" className="primary" onClick={save} disabled={busy || !image}>
          保存
        </button>
      </div>
    </div>
  )
}
