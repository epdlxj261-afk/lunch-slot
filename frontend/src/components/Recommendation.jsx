import { useEffect, useRef, useState } from 'react'
import { getRandomRecommendation } from '../api.js'
import { CATEGORIES, PRICE_RANGES, VISIT_STATUSES, labelOf } from '../constants.js'

const EMPTY_CONDITIONS = { category: '', priceRange: '', visitStatus: '' }

const CONDITION_SELECTS = [
  { field: 'category', label: '카테고리', options: CATEGORIES },
  { field: 'priceRange', label: '가격대', options: PRICE_RANGES },
  { field: 'visitStatus', label: '방문 상태', options: VISIT_STATUSES },
]

const SPIN_DURATION_MS = 1500
const SPIN_INTERVAL_MS = 80
// 회전 중에 돌아가는 그림. 결과와 무관한 장식이며 실제 결과는 서버 응답으로 정해진다.
const REEL_SYMBOLS = ['🍚', '🍜', '🍣', '🍝', '🍢', '☕', '🥟', '🍔']

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 추천 조건을 고르고 서버에서 무작위로 고른 식당 1곳을 슬롯머신 회전 후 보여 준다.
function Recommendation() {
  const [conditions, setConditions] = useState(EMPTY_CONDITIONS)
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [reelIndex, setReelIndex] = useState(0)
  // 상태 반영 전에 들어온 연속 클릭도 막기 위해 ref로 회전 여부를 바로 기록한다.
  const spinningRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  function setField(field) {
    return (event) => setConditions((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSpin() {
    if (spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setMessage('')
    intervalRef.current = setInterval(
      () => setReelIndex((index) => (index + 1) % REEL_SYMBOLS.length),
      SPIN_INTERVAL_MS,
    )

    // 요청은 회전 시작과 함께 한 번만 보내고, 응답과 1.5초가 모두 지나야 결과를 보여 준다.
    const request = getRandomRecommendation(conditions).then(
      (restaurant) => ({ restaurant }),
      (err) => ({ error: err.message }),
    )
    const [outcome] = await Promise.all([request, wait(SPIN_DURATION_MS)])

    clearInterval(intervalRef.current)
    if (outcome.restaurant) {
      setResult(outcome.restaurant)
      setMessage('')
    } else {
      setResult(null)
      setMessage(outcome.error)
    }
    spinningRef.current = false
    setSpinning(false)
  }

  const hasOutcome = result !== null || message !== ''

  return (
    <section className="recommendation">
      <h2>오늘의 추천</h2>
      <fieldset className="field-grid" disabled={spinning}>
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
      </fieldset>
      <button type="button" className="primary" onClick={handleSpin} disabled={spinning}>
        {spinning ? '돌리는 중...' : hasOutcome ? '다시 뽑기' : '추천받기'}
      </button>

      {spinning ? (
        <div className="slot-reel" aria-label="추천 식당을 고르는 중">
          <span key={reelIndex}>{REEL_SYMBOLS[reelIndex]}</span>
        </div>
      ) : (
        <>
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
        </>
      )}
    </section>
  )
}

export default Recommendation
