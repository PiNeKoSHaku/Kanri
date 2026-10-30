/** わくわくの実の種類（名前のみ。効果はゲーム内で確認する）。新しい実が出たら「その他」で入力できる。 */
export const FRUIT_GROUPS: { label: string; fruits: string[] }[] = [
  {
    label: '同族の絆',
    fruits: ['同族の絆・加撃', '同族の絆・加速', '同族の絆・加命', '同族の絆・加撃速', '同族の絆・加速命', '同族の絆・加命撃'],
  },
  {
    label: '撃種の絆',
    fruits: ['撃種の絆・加撃', '撃種の絆・加速', '撃種の絆・加命', '撃種の絆・加撃速', '撃種の絆・加速命', '撃種の絆・加命撃'],
  },
  {
    label: '戦型の絆',
    fruits: ['戦型の絆・加撃', '戦型の絆・加速', '戦型の絆・加命', '戦型の絆・加撃速', '戦型の絆・加速命', '戦型の絆・加命撃'],
  },
  {
    label: '自身のみ',
    fruits: ['熱き友撃の力', 'ケガ減りの力', '一撃失心の力', '速必殺の力', '毒がまんの力', 'ちび癒しの力'],
  },
  {
    label: 'クエスト・報酬',
    fruits: ['将命削りの力', '兵命削りの力', '学びの力', '荒稼ぎの力', 'スピクリの力', 'Sランクの力', 'スコア稼ぎの力', 'ハート強化の力'],
  },
]

export const KNOWN_FRUITS = new Set(FRUIT_GROUPS.flatMap((g) => g.fruits))

/** 実の等級。弱い順。各等級にM・Lがあり、Lがいちばん強い。 */
export const FRUIT_GRADES = ['4級', '3級', '2級', '1級', '特級'].flatMap((g) => [g, `${g}M`, `${g}L`])

/** 1体につける実の枠の上限（枠の数はキャラによって違うので、余裕をみて4つ） */
export const MAX_FRUIT_SLOTS = 4

export function fruitLabel(f: { name: string; grade?: string }): string {
  return f.grade ? `${f.name}(${f.grade})` : f.name
}
