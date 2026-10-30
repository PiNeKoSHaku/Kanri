import type { Monster } from '../db'

export function MonsterIcon({ monster, size = 64 }: { monster: Monster | undefined; size?: number }) {
  return (
    <span
      className={`icon el-${monster?.element ?? 'none'}`}
      style={{ width: size, height: size }}
      title={monster ? monster.name : '図鑑に無いモンスター'}
    >
      {monster?.icon ? <img src={monster.icon} alt={monster.name} /> : '?'}
    </span>
  )
}
