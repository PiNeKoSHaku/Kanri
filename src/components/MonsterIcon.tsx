import type { ZukanEntry } from '../db'
import { useObjectUrl } from '../lib/useObjectUrl'

export function MonsterIcon({ entry, size = 64 }: { entry: ZukanEntry | undefined; size?: number }) {
  const url = useObjectUrl(entry?.icon)
  return (
    <span
      className={`icon el-${entry?.element ?? 'none'}`}
      style={{ width: size, height: size }}
      title={entry ? `No.${entry.no} ${entry.name}` : '図鑑に無いモンスター'}
    >
      {url ? <img src={url} alt={entry?.name} /> : '?'}
    </span>
  )
}
