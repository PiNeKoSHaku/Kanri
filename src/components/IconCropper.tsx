import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { CropRect } from '../lib/image'

interface Props {
  image: HTMLImageElement
  onChange: (rect: CropRect) => void
}

/** スクショ上で正方形の枠をドラッグしてアイコン部分を選ぶ */
export function IconCropper({ image, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const minSide = Math.min(image.naturalWidth, image.naturalHeight)
  const [rect, setRect] = useState<CropRect>(() => {
    const size = Math.round(minSide / 4)
    return { x: Math.round((image.naturalWidth - size) / 2), y: Math.round((image.naturalHeight - size) / 2), size }
  })
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / image.naturalWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [image])

  useEffect(() => onChange(rect), [rect, onChange])

  const clamp = (r: CropRect): CropRect => ({
    size: r.size,
    x: Math.min(Math.max(0, r.x), image.naturalWidth - r.size),
    y: Math.min(Math.max(0, r.y), image.naturalHeight - r.size),
  })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: rect.x, y: rect.y }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    setRect((r) => clamp({ ...r, x: d.x + (e.clientX - d.px) / scale, y: d.y + (e.clientY - d.py) / scale }))
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const setSize = (size: number) =>
    setRect((r) => {
      const c = { x: r.x + r.size / 2, y: r.y + r.size / 2 }
      return clamp({ size, x: c.x - size / 2, y: c.y - size / 2 })
    })

  return (
    <div className="cropper">
      <div className="cropper-box" ref={boxRef}>
        <img src={image.src} alt="アップロードした画像" draggable={false} />
        <div
          className="cropper-frame"
          style={{ left: rect.x * scale, top: rect.y * scale, width: rect.size * scale, height: rect.size * scale }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      <label className="field">
        <span>枠の大きさ</span>
        <input
          type="range"
          min={Math.round(minSide / 20)}
          max={minSide}
          value={rect.size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </label>
      <p className="hint">枠をドラッグして、モンスターのアイコンに合わせてください。</p>
    </div>
  )
}
