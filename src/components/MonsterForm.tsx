import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { db, ELEMENTS, type Element, type Monster } from '../db'
import { detailArtRect, isDetailScreen, listGrid, listIconRect } from '../lib/detailScreen'
import { cropToDataUrl, loadImage, type CropRect } from '../lib/image'
import { IconCropper } from './IconCropper'
import { MonsterIcon } from './MonsterIcon'

interface Props {
  /** 編集時の既存のモンスター。無ければ新規登録（名前とアイコンだけ）。 */
  monster?: Monster
  /** 編集の名前欄に最初に入れる文字（読み取った名前の候補を選んだとき） */
  initialName?: string
  onDone: () => void
}

export function MonsterForm({ monster, initialName, onDone }: Props) {
  const [image, setImage] = useState<HTMLImageElement>()
  const [rect, setRect] = useState<CropRect>()
  const [name, setName] = useState(initialName ?? monster?.name ?? '')
  const [no, setNo] = useState(monster?.no === undefined ? '' : String(monster.no))
  const [element, setElement] = useState<Element | undefined>(monster?.element)
  const [rarity, setRarity] = useState<number | undefined>(monster?.rarity)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const statusRef = useRef<HTMLDivElement>(null)
  const onRect = useCallback((r: CropRect) => setRect(r), [])
  // スマホの縦長スクショなら、画面の種類に合わせた初期の枠を使う
  const [kind, setKind] = useState<'list' | 'detail'>('list')
  const [advance, setAdvance] = useState(0)
  const [count, setCount] = useState(0)
  const preset = image && isDetailScreen(image) ? kind : undefined
  const initialRect = !image
    ? undefined
    : preset === 'detail'
      ? detailArtRect(image)
      : preset === 'list'
        ? listIconRect(image)
        : undefined
  const grid = image && preset === 'list' ? listGrid(image) : undefined

  // 長いフォームでも結果が見えるよう、メッセージが出たら画面内に寄せる
  useEffect(() => {
    if (error || saved) statusRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error, saved])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      setImage(await loadImage(file))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved('')
    try {
      const trimmed = name.trim()
      const icon = image && rect ? cropToDataUrl(image, rect) : monster?.icon
      if (!icon) return setError('画像をアップロードしてアイコンを選んでください')
      let noValue: number | undefined
      if (monster && no.trim()) {
        noValue = Number(no)
        if (!Number.isInteger(noValue) || noValue <= 0) return setError('図鑑No.は1以上の整数で入力してください')
      }

      if (monster) {
        await db.monsters.put({ ...monster, name: trimmed, icon, no: noValue, element, rarity })
        return onDone()
      }
      await db.monsters.add({ name: '', icon, createdAt: Date.now() } as Monster)
      // 同じスクショから続けて登録できるよう、画像は残す
      setSaved(`アイコンを登録しました（${count + 1}体目）`)
      setCount((n) => n + 1)
      if (grid) setAdvance((n) => n + 1)
    } catch (err) {
      setError(`保存できませんでした: ${(err as Error).message}`)
    }
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <h2>{monster ? '図鑑を編集' : '図鑑にアイコンを追加'}</h2>
      <label className="field">
        <span>{monster ? 'アイコンを変えるときだけ、スクショ・写真' : 'スクショ・写真'}</span>
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
        monster && (
          <div className="row">
            <MonsterIcon monster={monster} />
          </div>
        )
      )}
      {monster && (
        <>
          <label className="field">
            <span>名前</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="grid2">
            <label className="field">
              <span>図鑑No.（任意）</span>
              <input inputMode="numeric" value={no} onChange={(e) => setNo(e.target.value)} />
            </label>
            <label className="field">
              <span>レアリティ（任意）</span>
              <select value={rarity ?? ''} onChange={(e) => setRarity(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">未設定</option>
                {[6, 5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    ★{r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="field">
            <span>属性（任意）</span>
            <div className="chips">
              {ELEMENTS.map((el) => (
                <button
                  type="button"
                  key={el}
                  className={`chip el-${el} ${element === el ? 'on' : ''}`}
                  onClick={() => setElement(element === el ? undefined : el)}
                >
                  {el}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
      <div ref={statusRef}>
        {error && <p className="error">{error}</p>}
        {saved && <p className="ok">{saved}</p>}
      </div>
      <div className="row end">
        <button type="button" onClick={onDone}>
          {monster ? 'キャンセル' : '閉じる'}
        </button>
        <button type="submit" className="primary">
          保存
        </button>
      </div>
    </form>
  )
}
