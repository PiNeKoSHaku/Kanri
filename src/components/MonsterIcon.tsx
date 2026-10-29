import type { ZukanEntry } from '../db'

export function MonsterIcon({ entry, size = 64 }: { entry: ZukanEntry | undefined; size?: number }) {
  return (
    <span
      className={`icon el-${entry?.element ?? 'none'}`}
      style={{ width: size, height: size }}
      title={entry ? `No.${entry.no} ${entry.name}` : '図鑑に無いモンスター'}
    >
      {entry ? <img src={entry.icon} alt={entry.name} /> : '?'}
    </span>
  )
}
