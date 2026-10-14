import { useEffect, useRef, useState } from 'react'
import { getRandomRecommendation, recordVisit } from '../api.js'
import {
  CATEGORIES,
  DEFAULT_EXCLUDE_DAYS,
  EXCLUDE_DAYS_MAX,
  EXCLUDE_DAYS_MIN,
  PRICE_RANGES,
  RATINGS,
  VISIT_STATUSES,
  labelOf,
  localToday,
  visitSummary,
} from '../constants.js'

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

// 제외 일수 입력을 검사한다. 1~30 정수면 숫자, 아니면 null.
function parseExcludeDays(text) {
  if (!/^\d+$/.test(text.trim())) return null
  const days = Number(text.trim())
  return days >= EXCLUDE_DAYS_MIN && days <= EXCLUDE_DAYS_MAX ? days : null
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 추천 조건을 고르고 서버에서 무작위로 고른 식당 1곳을 슬롯머신 회전 후 보여 준다.
// "여기로 결정"으로 방문을 기록하면 onVisited를 불러 목록을 갱신한다.
function Recommendation({ onVisited }) {
  const [conditions, setConditions] = useState(EMPTY_CONDITIONS)
  // 최근 방문 제외 옵션. 끄면 exclude_days를 보내지 않는다.
  const [excludeRecent, setExcludeRecent] = useState(false)
  const [excludeDaysText, setExcludeDaysText] = useState(String(DEFAULT_EXCLUDE_DAYS))
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [reelIndex, setReelIndex] = useState(0)
  // 결정할 때 함께 저장할 평점. 빈 값이면 기존 평점을 유지한다.
  const [visitRating, setVisitRating] = useState('')
  const [deciding, setDeciding] = useState(false)
  const [decisionMessage, setDecisionMessage] = useState('')
  const [decisionError, setDecisionError] = useState('')
  // 상태 반영 전에 들어온 연속 클릭도 막기 위해 ref로 회전 여부를 바로 기록한다.
  const spinningRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  function setField(field) {
    return (event) => setConditions((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSpin() {
    if (spinningRef.current) return
    const excludeDays = excludeRecent ? parseExcludeDays(excludeDaysText) : null
    if (excludeRecent && excludeDays === null) {
      setResult(null)
      setMessage(`제외 일수는 ${EXCLUDE_DAYS_MIN}~${EXCLUDE_DAYS_MAX} 사이의 정수로 입력하세요.`)
      return
    }
    spinningRef.current = true
    setSpinning(true)
    setMessage('')
    setVisitRating('')
    setDecisionMessage('')
    setDecisionError('')
    intervalRef.current = setInterval(
      () => setReelIndex((index) => (index + 1) % REEL_SYMBOLS.length),
      SPIN_INTERVAL_MS,
    )

    // 요청은 회전 시작과 함께 한 번만 보내고, 응답과 1.5초가 모두 지나야 결과를 보여 준다.
    const options = excludeDays === null ? {} : { excludeDays, today: localToday() }
    const request = getRandomRecommendation(conditions, options).then(
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

  async function handleDecide() {
    if (!result || deciding) return
    setDeciding(true)
    setDecisionError('')
    try {
      const updated = await recordVisit(result.id, {
        visitedOn: localToday(),
        rating: visitRating === '' ? null : Number(visitRating),
      })
      setResult(updated)
      setVisitRating('')
      setDecisionMessage(`방문을 기록했습니다. (${updated.visitCount}회째)`)
      onVisited()
    } catch (err) {
      setDecisionMessage('')
      setDecisionError(err.message)
    } finally {
      setDeciding(false)
    }
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
      <fieldset className="exclude-row" disabled={spinning}>
        <label>
          <input
            type="checkbox"
            checked={excludeRecent}
            onChange={(event) => setExcludeRecent(event.target.checked)}
          />{' '}
          최근
        </label>
        <input
          type="number"
          className="exclude-days"
          aria-label="제외할 최근 방문 일수"
          min={EXCLUDE_DAYS_MIN}
          max={EXCLUDE_DAYS_MAX}
          step={1}
          value={excludeDaysText}
          onChange={(event) => setExcludeDaysText(event.target.value)}
          disabled={!excludeRecent}
        />
        <span>일 이내 방문한 곳 제외</span>
      </fieldset>
      <button
        type="button"
        className="primary"
        onClick={handleSpin}
        disabled={spinning || deciding}
      >
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
              {visitSummary(result) && (
                <p className="item-location">{visitSummary(result)}</p>
              )}
              {result.location && <p className="item-location">위치: {result.location}</p>}
              <div className="decide-row">
                <label htmlFor="visit-rating">평점</label>
                <select
                  id="visit-rating"
                  value={visitRating}
                  onChange={(event) => setVisitRating(event.target.value)}
                  disabled={deciding}
                >
                  <option value="">선택 안 함(기존 유지)</option>
                  {RATINGS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}점
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleDecide} disabled={deciding}>
                  {deciding ? '기록 중...' : '여기로 결정'}
                </button>
              </div>
              {decisionMessage && (
                <p className="decide-message" role="status">
                  {decisionMessage}
                </p>
              )}
              {decisionError && (
                <p className="error" role="alert">
                  {decisionError}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Recommendation
