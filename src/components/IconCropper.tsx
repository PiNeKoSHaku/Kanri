import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { CropRect } from '../lib/image'

interface Props {
  image: HTMLImageElement
  /** 最初の枠。省略すると画像の中央に置く。 */
  initialRect?: CropRect
  onChange: (rect: CropRect) => void
}

const PREVIEW = 96

/** 押している間、くり返し実行するボタン（細かい調整用） */
function RepeatButton({ onStep, label, children }: { onStep: () => void; label: string; children: ReactNode }) {
  const timer = useRef<number>(undefined)
  const stop = () => window.clearTimeout(timer.current)
  const start = () => {
    onStep()
    const tick = (delay: number) => {
      timer.current = window.setTimeout(() => {
        onStep()
        tick(60)
      }, delay)
    }
    tick(350)
  }
  useEffect(() => stop, [])
  return (
    <button
      type="button"
      className="nudge"
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}

/** スクショ上で正方形の枠を動かして、アイコンにする範囲を選ぶ */
export function IconCropper({ image, initialRect, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  const minSize = Math.max(16, Math.round(Math.min(iw, ih) / 20))
  const maxSize = Math.min(iw, ih)
  const [start] = useState<CropRect>(() => {
    if (initialRect) return initialRect
    const size = Math.round(Math.min(iw, ih) / 4)
    return { x: Math.round((iw - size) / 2), y: Math.round((ih - size) / 2), size }
  })
  const [rect, setRect] = useState<CropRect>(start)
  const drag = useRef<{ mode: 'move' | 'resize'; px: number; py: number; rect: CropRect } | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / iw)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [iw])

  useEffect(() => onChange(rect), [rect, onChange])

  // 保存される絵と同じ範囲を、図鑑に並ぶときの見た目でプレビューする
  useEffect(() => {
    const ctx = previewRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, PREVIEW * 2, PREVIEW * 2)
    ctx.drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, PREVIEW * 2, PREVIEW * 2)
  }, [image, rect])

  const clampPos = useCallback(
    (r: CropRect): CropRect => ({
      size: r.size,
      x: Math.min(Math.max(0, r.x), iw - r.size),
      y: Math.min(Math.max(0, r.y), ih - r.size),
    }),
    [iw, ih],
  )

  const onPointerDown = (mode: 'move' | 'resize') => (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mode, px: e.clientX, py: e.clientY, rect }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.px) / scale
    const dy = (e.clientY - d.py) / scale
    if (d.mode === 'move') {
      setRect(clampPos({ ...d.rect, x: d.rect.x + dx, y: d.rect.y + dy }))
    } else {
      // 左上を固定して、右下の角を引っぱる
      const max = Math.min(iw - d.rect.x, ih - d.rect.y)
      const size = Math.min(max, Math.max(minSize, d.rect.size + Math.max(dx, dy)))
      setRect({ ...d.rect, size })
    }
  }
  const onPointerUp = () => {
    drag.current = null
  }

  /** 中心を保ったまま大きさを変える */
  const resizeBy = (delta: number) =>
    setRect((r) => {
      const size = Math.min(maxSize, Math.max(minSize, r.size + delta))
      return clampPos({ size, x: r.x + (r.size - size) / 2, y: r.y + (r.size - size) / 2 })
    })
  const moveBy = (dx: number, dy: number) => setRect((r) => clampPos({ ...r, x: r.x + dx, y: r.y + dy }))
  // 1回の操作量は枠の大きさに合わせる（小さい枠ほど細かく動く）
  const step = Math.max(1, Math.round(rect.size / 100))

  return (
    <div className="cropper">
      <div className="cropper-tools">
        <canvas ref={previewRef} className="cropper-preview" width={PREVIEW * 2} height={PREVIEW * 2} />
        <div className="cropper-controls">
          <div className="nudge-pad">
            <span />
            <RepeatButton label="上へ" onStep={() => moveBy(0, -step)}>
              ↑
            </RepeatButton>
            <span />
            <RepeatButton label="左へ" onStep={() => moveBy(-step, 0)}>
              ←
            </RepeatButton>
            <span />
            <RepeatButton label="右へ" onStep={() => moveBy(step, 0)}>
              →
            </RepeatButton>
            <span />
            <RepeatButton label="下へ" onStep={() => moveBy(0, step)}>
              ↓
            </RepeatButton>
            <span />
          </div>
          <div className="row">
            <RepeatButton label="縮小" onStep={() => resizeBy(-step * 2)}>
              −
            </RepeatButton>
            <span className="hint">大きさ</span>
            <RepeatButton label="拡大" onStep={() => resizeBy(step * 2)}>
              ＋
            </RepeatButton>
            <button type="button" onClick={() => setRect(start)}>
              リセット
            </button>
          </div>
        </div>
      </div>
      <div className="cropper-box" ref={boxRef}>
        <img src={image.src} alt="アップロードした画像" draggable={false} />
        <div
          className="cropper-frame"
          style={{ left: rect.x * scale, top: rect.y * scale, width: rect.size * scale, height: rect.size * scale }}
          onPointerDown={onPointerDown('move')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="cropper-handle"
            onPointerDown={onPointerDown('resize')}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>
      <p className="hint">枠をドラッグで動かし、右下の■で大きさを変えます。ボタンを押し続けると細かく動かせます。上のプレビューが保存される絵です。</p>
    </div>
  )
}
