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

/**
 * 画像の一部を切り出して拡大し、白黒にする（文字の読み取り用）。
 * threshold があれば、白い文字だけを黒、それ以外を白にする。無ければ濃淡のまま。
 */
function binarize(img: HTMLImageElement, region: [number, number, number, number], scale: number, threshold: number | null) {
  const w = img.naturalWidth
  const [x, y, rw, rh] = region.map((v) => v * w)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(rw * scale)
  canvas.height = Math.round(rh * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, x, y, rw, rh, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < data.data.length; i += 4) {
    const gray = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]
    const v = threshold === null ? gray : gray > threshold ? 0 : 255
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

// 詳細画面の左上。幅を1とした相対位置: [x, y, 幅, 高さ]
const NO_REGION: [number, number, number, number] = [0.17, 0.152, 0.36, 0.044]
const NAME_REGION: [number, number, number, number] = [0.1842, 0.1983, 0.65, 0.0531]
// 文字の太さや背景で読み取りが変わるので、設定を変えて何回か読み、違う結果を候補にする
const NAME_VARIANTS: { scale: number; threshold: number | null }[] = [
  { scale: 1, threshold: null },
  { scale: 2, threshold: null },
  { scale: 3, threshold: 180 },
  { scale: 2, threshold: 150 },
]

export interface DetailText {
  no?: number
  /** 名前の読み取り結果。間違いを含むので候補として見せる。 */
  names: string[]
}

/** 詳細画面の写真から、図鑑No.と名前を読み取る。読めなかったものは入らない。 */
export async function readDetailText(
  img: HTMLImageElement,
  want: { no: boolean; name: boolean },
): Promise<DetailText> {
  const { createWorker, PSM } = await import('tesseract.js')
  const abs = (path: string) => new URL(path, document.baseURI).href
  const [{ default: workerPath }, { default: corePath }] = await Promise.all([
    import('tesseract.js/dist/worker.min.js?url'),
    import('tesseract.js-core/tesseract-core-lstm.wasm.js?url'),
  ])
  const worker = await createWorker('jpn', 1, {
    workerPath: abs(workerPath),
    corePath: abs(corePath),
    langPath: abs(`${import.meta.env.BASE_URL}tessdata`),
  })
  const result: DetailText = { names: [] }
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE })
    if (want.no) {
      const { data } = await worker.recognize(binarize(img, NO_REGION, 2, 180))
      const m = data.text.match(/No\.?\s*(\d{1,5})/i)
      if (m) result.no = Number(m[1])
    }
    if (want.name) {
      for (const v of NAME_VARIANTS) {
        const { data } = await worker.recognize(binarize(img, NAME_REGION, v.scale, v.threshold))
        const text = data.text.replace(/\s+/g, '')
        if (text && !result.names.includes(text)) result.names.push(text)
      }
    }
    return result
  } finally {
    await worker.terminate()
  }
}
