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
