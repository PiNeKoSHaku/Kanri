import { ELEMENTS } from '../db'
import type { FilterState } from '../lib/filter'

export function Filters({ value, onChange }: { value: FilterState; onChange: (f: FilterState) => void }) {
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="名前・図鑑No.で検索"
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
      />
      <div className="chips">
        {ELEMENTS.map((el) => (
          <button
            type="button"
            key={el}
            className={`chip el-${el} ${value.element === el ? 'on' : ''}`}
            onClick={() => onChange({ ...value, element: value.element === el ? null : el })}
          >
            {el}
          </button>
        ))}
      </div>
    </div>
  )
}
