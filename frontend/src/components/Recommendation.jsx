import { useState } from 'react'
import { getRandomRecommendation } from '../api.js'
import { CATEGORIES, PRICE_RANGES, VISIT_STATUSES, labelOf } from '../constants.js'

const EMPTY_CONDITIONS = { category: '', priceRange: '', visitStatus: '' }

const CONDITION_SELECTS = [
  { field: 'category', label: '카테고리', options: CATEGORIES },
  { field: 'priceRange', label: '가격대', options: PRICE_RANGES },
  { field: 'visitStatus', label: '방문 상태', options: VISIT_STATUSES },
]

// 추천 조건을 고르고 서버에서 무작위로 고른 식당 1곳을 보여 준다.
function Recommendation() {
  const [conditions, setConditions] = useState(EMPTY_CONDITIONS)
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(field) {
    return (event) => setConditions((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleRecommend() {
    if (loading) return
    setLoading(true)
    try {
      setResult(await getRandomRecommendation(conditions))
      setMessage('')
    } catch (err) {
      setResult(null)
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="recommendation">
      <h2>오늘의 추천</h2>
      <div className="field-grid">
        {CONDITION_SELECTS.map(({ field, label, options }) => (
          <div className="field" key={field}>
            <label htmlFor={`recommend-${field}`}>{label}</label>
            <select
              id={`recommend-${field}`}
              value={conditions[field]}
              onChange={setField(field)}
            >
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
      <button type="button" className="primary" onClick={handleRecommend} disabled={loading}>
        {loading ? '고르는 중...' : '추천받기'}
      </button>

      {message && (
        <p className="recommend-message" role="status">
          {message}
        </p>
      )}
      {result && (
        <div className="recommend-result" aria-live="polite">
          <p className="recommend-name">{result.name}</p>
          <div className="item-tags">
            <span>{labelOf(CATEGORIES, result.category)}</span>
            <span>{labelOf(PRICE_RANGES, result.priceRange)}</span>
            <span>{labelOf(VISIT_STATUSES, result.visitStatus)}</span>
            <span>{result.rating === null ? '평점 없음' : `평점 ${result.rating}점`}</span>
          </div>
          {result.location && <p className="item-location">위치: {result.location}</p>}
        </div>
      )}
    </section>
  )
}

export default Recommendation
