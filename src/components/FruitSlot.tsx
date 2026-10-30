import type { Fruit } from '../db'
import { FRUIT_GRADES, FRUIT_GROUPS, KNOWN_FRUITS } from '../lib/fruits'

const CUSTOM = '__custom__'

interface Props {
  index: number
  fruit: Fruit
  onChange: (fruit: Fruit) => void
  onRemove: () => void
}

/** わくわくの実の1枠。一覧から選ぶか、「その他」で名前を入力する。 */
export function FruitSlot({ index, fruit, onChange, onRemove }: Props) {
  const isCustom = fruit.name !== '' && !KNOWN_FRUITS.has(fruit.name)
  return (
    <div className="fruit-slot">
      <div className="row">
        <select
          aria-label={`実${index + 1}`}
          value={isCustom ? CUSTOM : fruit.name}
          onChange={(e) => onChange({ ...fruit, name: e.target.value === CUSTOM ? ' ' : e.target.value })}
        >
          <option value="">（なし）</option>
          {FRUIT_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.fruits.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={CUSTOM}>その他（入力）</option>
        </select>
        <button type="button" onClick={onRemove} aria-label={`実${index + 1}の枠を消す`}>
          ✕
        </button>
      </div>
      {(isCustom || fruit.name === ' ') && (
        <input
          placeholder="実の名前"
          value={fruit.name.trim() === '' ? '' : fruit.name}
          onChange={(e) => onChange({ ...fruit, name: e.target.value || ' ' })}
        />
      )}
      {fruit.name.trim() !== '' && (
        <select
          aria-label={`実${index + 1}の等級`}
          value={fruit.grade ?? ''}
          onChange={(e) => onChange({ ...fruit, grade: e.target.value || undefined })}
        >
          <option value="">等級（任意）</option>
          {FRUIT_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
