import type { Monster } from '../db'

/** 名前がまだ無いモンスターの表示名 */
export const UNNAMED = '名前未設定'

export function monsterName(monster: Monster | undefined): string {
  return monster?.name || UNNAMED
}
