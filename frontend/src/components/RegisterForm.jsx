import { useState } from 'react'
import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  DEFAULT_PRICE_RANGE,
  DEFAULT_VISIT_STATUS,
  PRICE_RANGES,
  RATINGS,
  VISIT_STATUSES,
} from '../constants.js'

const EMPTY_FORM = {
  name: '',
  category: DEFAULT_CATEGORY,
  priceRange: DEFAULT_PRICE_RANGE,
  location: '',
  memo: '',
  visitStatus: DEFAULT_VISIT_STATUS,
  rating: '',
}

// 식당 등록 폼. onRegister는 실패하면 오류 메시지, 성공하면 null을 돌려준다(Promise).
function RegisterForm({ onRegister }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  // 요청 중에는 폼을 잠가 중복 등록을 막는다.
  const [submitting, setSubmitting] = useState(false)

  function setField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const message = await onRegister({
      ...form,
      rating: form.rating === '' ? null : Number(form.rating),
    })
    setSubmitting(false)
    if (message) {
      setError(message)
      return
    }
    setForm(EMPTY_FORM)
    setError('')
  }

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <fieldset disabled={submitting}>
        <legend>식당 등록</legend>

        <div className="field">
          <label htmlFor="register-name">식당 이름</label>
          <input
            id="register-name"
            type="text"
            value={form.name}
            onChange={setField('name')}
            placeholder="예: 국밥집"
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="register-category">카테고리</label>
            <select id="register-category" value={form.category} onChange={setField('category')}>
              {CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="register-price">가격대</label>
            <select id="register-price" value={form.priceRange} onChange={setField('priceRange')}>
              {PRICE_RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="register-visit">방문 상태</label>
            <select id="register-visit" value={form.visitStatus} onChange={setField('visitStatus')}>
              {VISIT_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="register-rating">평점</label>
            <select id="register-rating" value={form.rating} onChange={setField('rating')}>
              <option value="">없음</option>
              {RATINGS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}점
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="register-location">위치</label>
          <input
            id="register-location"
            type="text"
            value={form.location}
            onChange={setField('location')}
            placeholder="예: 회사 1층"
          />
        </div>

        <div className="field">
          <label htmlFor="register-memo">메모</label>
          <textarea id="register-memo" rows={3} value={form.memo} onChange={setField('memo')} />
        </div>

        <button type="submit" className="primary">
          {submitting ? '등록 중...' : '등록'}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </form>
  )
}

export default RegisterForm
