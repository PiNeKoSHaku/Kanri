import { ELEMENTS, type Element } from '../db'
import type { CropRect } from './image'

/*
 * ゲーム内「モンスター詳細画面」のスクショ用の読み取り。
 * 座標は幅を1とした相対値（幅923px基準の画面から換算）。機種が違っても縦横比が近ければ合う。
 */

/** スマホの縦長スクショ（詳細画面）かどうか */
export function isDetailScreen(img: HTMLImageElement): boolean {
  return img.naturalHeight / img.naturalWidth > 1.9
}

/** 中央のモンスター画像の範囲 */
export function detailArtRect(img: HTMLImageElement): CropRect {
  const w = img.naturalWidth
  return { x: Math.round(0.11 * w), y: Math.round(0.357 * w), size: Math.round(0.78 * w) }
}

/** 図鑑一覧画面（アイコンが5列に並ぶ画面）の、いちばん上の行の左端のアイコン。ラベルの「No.」にかからない正方形。 */
export function listIconRect(img: HTMLImageElement): CropRect {
  const w = img.naturalWidth
  return { x: Math.round(0.0665 * w), y: Math.round(0.768 * w), size: Math.round(0.13 * w) }
}

/** 図鑑一覧画面でアイコンが並ぶ間隔（px）。列の数と、横・縦の間隔。 */
export function listGrid(img: HTMLImageElement): { cols: number; dx: number; dy: number } {
  const w = img.naturalWidth
  return { cols: 5, dx: 0.1815 * w, dy: 0.1777 * w }
}

/** 属性アイコン（左下の丸）の色から属性を判定する */
export function detectElement(img: HTMLImageElement): Element | undefined {
  const w = img.naturalWidth
  const cx = 0.068 * w
  const cy = 1.17 * w
  const r = 0.024 * w
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.ceil(r * 2)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const hues: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2])
    if (s > 0.4 && v > 0.3) hues.push(h)
  }
  if (hues.length < 20) return undefined
  hues.sort((a, b) => a - b)
  return hueToElement(hues[hues.length >> 1])
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const d = max - min
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  let h = 0
  if (d > 0) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max === 0 ? 0 : d / max, max]
}

function hueToElement(h: number): Element {
  const [fire, water, wood, light, dark] = ELEMENTS
  if (h < 25 || h >= 335) return fire
  if (h < 75) return light
  if (h < 170) return wood
  if (h < 255) return water
  return dark
}

/** 左上の「No.9204」から図鑑No.を読み取る。見つからなければ undefined。 */
export async function readZukanNo(img: HTMLImageElement): Promise<number | undefined> {
  const w = img.naturalWidth
  const sx = 0.17 * w
  const sy = 0.152 * w
  const sw = 0.36 * w
  const sh = 0.044 * w
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * 2)
  canvas.height = Math.round(sh * 2)
  canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  const { createWorker } = await import('tesseract.js')
  const abs = (path: string) => new URL(path, document.baseURI).href
  const [{ default: workerPath }, { default: corePath }] = await Promise.all([
    import('tesseract.js/dist/worker.min.js?url'),
    import('tesseract.js-core/tesseract-core-lstm.wasm.js?url'),
  ])
  const worker = await createWorker('eng', 1, {
    workerPath: abs(workerPath),
    corePath: abs(corePath),
    langPath: abs(`${import.meta.env.BASE_URL}tessdata`),
  })
  try {
    const { data } = await worker.recognize(canvas)
    const m = data.text.match(/No\.?\s*(\d{1,5})/i)
    return m ? Number(m[1]) : undefined
  } finally {
    await worker.terminate()
  }
}
