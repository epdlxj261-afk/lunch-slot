import { CATEGORIES, EMPTY_FILTERS, PRICE_RANGES, VISIT_STATUSES } from '../constants.js'

// 이름 검색과 카테고리·가격대·방문 상태 필터. 빈 문자열은 "전체"를 뜻한다.
function FilterBar({ filters, onChange }) {
  function setField(field) {
    return (event) => onChange({ ...filters, [field]: event.target.value })
  }

  const selects = [
    { field: 'category', label: '카테고리', options: CATEGORIES },
    { field: 'priceRange', label: '가격대', options: PRICE_RANGES },
    { field: 'visitStatus', label: '방문 상태', options: VISIT_STATUSES },
  ]

  return (
    <div className="filter-bar">
      <div className="field">
        <label htmlFor="filter-q">이름 검색</label>
        <input id="filter-q" type="search" value={filters.q} onChange={setField('q')} />
      </div>
      <div className="field-grid">
        {selects.map(({ field, label, options }) => (
          <div className="field" key={field}>
            <label htmlFor={`filter-${field}`}>{label}</label>
            <select id={`filter-${field}`} value={filters[field]} onChange={setField(field)}>
              <option value="">전체</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange(EMPTY_FILTERS)}>
        필터 초기화
      </button>
    </div>
  )
}

export default FilterBar
