export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('画像を読み込めませんでした'))
    }
    img.src = url
  })
}

export interface CropRect {
  x: number
  y: number
  size: number
}

/** 画像の正方形領域を切り出して、指定サイズのJPEG(data URL)にする */
export function cropToDataUrl(img: HTMLImageElement, rect: CropRect, outSize = 192): string {
  const canvas = document.createElement('canvas')
  canvas.width = outSize
  canvas.height = outSize
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, rect.x, rect.y, rect.size, rect.size, 0, 0, outSize, outSize)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/** 縦横を自由に切り出す範囲（写真用） */
export interface PhotoRect {
  x: number
  y: number
  w: number
  h: number
}

/** 範囲を切り出して、幅が maxWidth を超えるなら縮めたJPEG(data URL)にする */
export function cropPhotoToDataUrl(img: HTMLImageElement, rect: PhotoRect, maxWidth = 900): string {
  const k = Math.min(1, maxWidth / rect.w)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(rect.w * k)
  canvas.height = Math.round(rect.h * k)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

/**
 * スマホの縦長スクショなら、上のステータスバーと下の余白を切り取った範囲。
 * それ以外の画像は全体。
 */
export function defaultPhotoRect(img: HTMLImageElement): PhotoRect {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (h / w <= 1.9) return { x: 0, y: 0, w, h }
  const top = Math.round(0.062 * h)
  return { x: 0, y: top, w, h: Math.round(0.953 * h) - top }
}
