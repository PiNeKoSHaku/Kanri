import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { defaultPhotoRect, type PhotoRect } from '../lib/image'

interface Props {
  image: HTMLImageElement
  onChange: (rect: PhotoRect) => void
}

const MIN = 40

type Mode = 'move' | 'tl' | 'br'

/** 写真の必要な部分だけを、縦横自由な四角で選ぶ */
export function PhotoCropper({ image, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  const [rect, setRect] = useState<PhotoRect>(() => defaultPhotoRect(image))
  const drag = useRef<{ mode: Mode; px: number; py: number; rect: PhotoRect } | null>(null)

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

  const onPointerDown = (mode: Mode) => (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mode, px: e.clientX, py: e.clientY, rect }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.px) / scale
    const dy = (e.clientY - d.py) / scale
    const r = d.rect
    if (d.mode === 'move') {
      setRect({
        ...r,
        x: Math.min(Math.max(0, r.x + dx), iw - r.w),
        y: Math.min(Math.max(0, r.y + dy), ih - r.h),
      })
    } else if (d.mode === 'br') {
      setRect({
        ...r,
        w: Math.min(iw - r.x, Math.max(MIN, r.w + dx)),
        h: Math.min(ih - r.y, Math.max(MIN, r.h + dy)),
      })
    } else {
      // 右下を固定して、左上の角を引っぱる
      const right = r.x + r.w
      const bottom = r.y + r.h
      const x = Math.min(right - MIN, Math.max(0, r.x + dx))
      const y = Math.min(bottom - MIN, Math.max(0, r.y + dy))
      setRect({ x, y, w: right - x, h: bottom - y })
    }
  }
  const onPointerUp = () => {
    drag.current = null
  }
  const handlers = (mode: Mode) => ({
    onPointerDown: onPointerDown(mode),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  })

  return (
    <div className="cropper">
      <div className="row">
        <button type="button" onClick={() => setRect(defaultPhotoRect(image))}>
          上下の余白をカット
        </button>
        <button type="button" onClick={() => setRect({ x: 0, y: 0, w: iw, h: ih })}>
          全体
        </button>
      </div>
      <div className="cropper-box" ref={boxRef}>
        <img src={image.src} alt="アップロードした写真" draggable={false} />
        <div
          className="cropper-frame"
          style={{ left: rect.x * scale, top: rect.y * scale, width: rect.w * scale, height: rect.h * scale }}
          {...handlers('move')}
        >
          <div className="cropper-handle tl" {...handlers('tl')} />
          <div className="cropper-handle" {...handlers('br')} />
        </div>
      </div>
      <p className="hint">枠の外側は切り取られます。枠をドラッグで動かし、左上と右下の■で範囲を変えます。</p>
    </div>
  )
}
