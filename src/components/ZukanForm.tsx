import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { db, ELEMENTS, type Element, type ZukanEntry } from '../db'
import { cropToDataUrl, loadImage, type CropRect } from '../lib/image'
import { detailArtRect, detectElement, isDetailScreen, listGrid, listIconRect, readZukanNo } from '../lib/detailScreen'
import { IconCropper } from './IconCropper'
import { MonsterIcon } from './MonsterIcon'

interface Props {
  /** 編集時の既存エントリ。無ければ新規登録。 */
  entry?: ZukanEntry
  onDone: () => void
}

export function ZukanForm({ entry, onDone }: Props) {
  const [image, setImage] = useState<HTMLImageElement>()
  const [rect, setRect] = useState<CropRect>()
  const [no, setNo] = useState(entry ? String(entry.no) : '')
  const [name, setName] = useState(entry?.name ?? '')
  const [element, setElement] = useState<Element>(entry?.element ?? '火')
  const [rarity, setRarity] = useState(entry?.rarity ?? 6)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const statusRef = useRef<HTMLDivElement>(null)
  const onRect = useCallback((r: CropRect) => setRect(r), [])

  // 長いフォームでも結果が見えるよう、メッセージが出たら画面内に寄せる
  useEffect(() => {
    if (error || saved) statusRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error, saved])

  const [reading, setReading] = useState(false)
  const [notice, setNotice] = useState('')
  // スマホの縦長スクショなら、画面の種類に合わせた初期の枠を使う
  const [kind, setKind] = useState<'list' | 'detail'>('list')
  const [advance, setAdvance] = useState(0)
  const preset = image && isDetailScreen(image) ? kind : undefined
  const initialRect = !image
    ? undefined
    : preset === 'detail'
      ? detailArtRect(image)
      : preset === 'list'
        ? listIconRect(image)
        : undefined
  const grid = image && preset === 'list' ? listGrid(image) : undefined

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setNotice('')
    try {
      setImage(await loadImage(file))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // モンスター詳細画面のスクショなら、属性と図鑑No.を自動で読み取る
  useEffect(() => {
    if (!image || preset !== 'detail') return
    let cancelled = false
    const run = async () => {
      const el = detectElement(image)
      if (el) setElement(el)
      setReading(true)
      try {
        const num = await readZukanNo(image)
        if (cancelled) return
        if (num) setNo(String(num))
        setNotice(
          `詳細画面として読み取りました${num ? `（No.${num}` : '（No.は読めませんでした'}${el ? `・${el}属性` : ''}）。名前などは確認して入力してください。`,
        )
      } catch {
        if (!cancelled) setNotice('図鑑No.の自動読み取りに失敗しました。手入力してください。')
      } finally {
        if (!cancelled) setReading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [image, preset])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved('')
    try {
      const num = Number(no)
      if (!Number.isInteger(num) || num <= 0) return setError('図鑑No.は1以上の整数で入力してください')
      if (!name.trim()) return setError('名前を入力してください')
      const icon = image && rect ? cropToDataUrl(image, rect) : entry?.icon
      if (!icon) return setError('画像をアップロードしてアイコンを選んでください')
      if (num !== entry?.no && (await db.zukan.get(num))) return setError(`No.${num} はすでに図鑑にあります`)

      await db.transaction('rw', db.zukan, db.owned, async () => {
        if (entry && entry.no !== num) {
          await db.zukan.delete(entry.no)
          await db.owned.where('no').equals(entry.no).modify({ no: num })
        }
        await db.zukan.put({ no: num, name: name.trim(), element, rarity, icon, createdAt: entry?.createdAt ?? Date.now() })
      })

      if (entry) return onDone()
      // 同じスクショから続けて別のモンスターを切り出せるよう、画像は残す
      setSaved(`No.${num} ${name.trim()} を登録しました`)
      setName('')
      if (grid) {
        // 一覧画面は番号が飛び飛びなので、枠を次のアイコンへ進めて番号は空にする
        setNo('')
        setAdvance((n) => n + 1)
      } else {
        setNo(String(num + 1))
      }
    } catch (err) {
      setError(`保存できませんでした: ${(err as Error).message}`)
    }
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <h2>{entry ? '図鑑を編集' : '図鑑に追加'}</h2>
      <label className="field">
        <span>スクショ・写真</span>
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {image ? (
        <>
          {isDetailScreen(image) && (
            <fieldset className="field">
              <span>スクショの種類</span>
              <div className="chips">
                <button type="button" className={`chip on-accent ${kind === 'list' ? 'on' : ''}`} onClick={() => setKind('list')}>
                  図鑑一覧
                </button>
                <button type="button" className={`chip on-accent ${kind === 'detail' ? 'on' : ''}`} onClick={() => setKind('detail')}>
                  詳細画面
                </button>
              </div>
            </fieldset>
          )}
          <IconCropper
            key={`${image.src}-${preset}`}
            image={image}
            initialRect={initialRect}
            grid={grid}
            advanceToken={advance}
            onChange={onRect}
          />
        </>
      ) : (
        entry && (
          <div className="row">
            <MonsterIcon entry={entry} />
            <span className="hint">画像を変えるときだけアップロードしてください</span>
          </div>
        )
      )}
      <div className="grid2">
        <label className="field">
          <span>図鑑No.</span>
          <input inputMode="numeric" value={no} onChange={(e) => setNo(e.target.value)} />
        </label>
        <label className="field">
          <span>レアリティ</span>
          <select value={rarity} onChange={(e) => setRarity(Number(e.target.value))}>
            {[6, 5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                ★{r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>名前</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <fieldset className="field">
        <span>属性</span>
        <div className="chips">
          {ELEMENTS.map((el) => (
            <button
              type="button"
              key={el}
              className={`chip el-${el} ${element === el ? 'on' : ''}`}
              onClick={() => setElement(el)}
            >
              {el}
            </button>
          ))}
        </div>
      </fieldset>
      {preset === 'detail' && reading && <p className="hint">読み取り中…（初回は少し時間がかかります）</p>}
      {preset === 'detail' && notice && <p className="hint">{notice}</p>}
      <div ref={statusRef}>
        {error && <p className="error">{error}</p>}
        {saved && <p className="ok">{saved}</p>}
      </div>
      <div className="row end">
        <button type="button" onClick={onDone}>
          {entry ? 'キャンセル' : '閉じる'}
        </button>
        <button type="submit" className="primary">
          保存
        </button>
      </div>
    </form>
  )
}
