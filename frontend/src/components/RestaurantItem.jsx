import { useState } from 'react'
import { CATEGORIES, PRICE_RANGES, VISIT_STATUSES, labelOf, visitSummary } from '../constants.js'

// 목록의 식당 한 곳. 수정·삭제는 모두 restaurant.id 기준으로 상위에 요청한다.
// 수정할 수 있는 항목은 이름·위치·메모뿐이다.
function RestaurantItem({ restaurant, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  // 저장·삭제 요청 중에는 버튼을 잠가 중복 요청을 막는다.
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState({ name: '', location: '', memo: '' })
  const [error, setError] = useState('')

  function setField(field) {
    return (event) => setDraft((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function startEdit() {
    setDraft({ name: restaurant.name, location: restaurant.location, memo: restaurant.memo })
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function handleSave(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    // 실패하면 오류 메시지, 성공하면 null을 받는다.
    const message = await onUpdate(restaurant.id, draft)
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    setEditing(false)
    setError('')
  }

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    await onDelete(restaurant.id)
    setBusy(false)
  }

  if (editing) {
    const idPrefix = `edit-${restaurant.id}`
    return (
      <li>
        <form className="edit-form" onSubmit={handleSave}>
          <div className="field">
            <label htmlFor={`${idPrefix}-name`}>식당 이름</label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              value={draft.name}
              onChange={setField('name')}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor={`${idPrefix}-location`}>위치</label>
            <input
              id={`${idPrefix}-location`}
              type="text"
              value={draft.location}
              onChange={setField('location')}
            />
          </div>
          <div className="field">
            <label htmlFor={`${idPrefix}-memo`}>메모</label>
            <textarea
              id={`${idPrefix}-memo`}
              rows={3}
              value={draft.memo}
              onChange={setField('memo')}
            />
          </div>
          <div className="item-actions">
            <button type="submit" disabled={busy}>
              {busy ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={cancelEdit} disabled={busy}>
              취소
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </li>
    )
  }

  return (
    <li>
      <div className="item-row">
        <span className="item-name">{restaurant.name}</span>
        <div className="item-actions">
          <button type="button" onClick={startEdit} disabled={busy}>
            수정
          </button>
          <button type="button" onClick={handleDelete} disabled={busy}>
            삭제
          </button>
        </div>
      </div>
      <div className="item-tags">
        <span>{labelOf(CATEGORIES, restaurant.category)}</span>
        <span>{labelOf(PRICE_RANGES, restaurant.priceRange)}</span>
        <span>{labelOf(VISIT_STATUSES, restaurant.visitStatus)}</span>
        <span>{restaurant.rating === null ? '평점 없음' : `평점 ${restaurant.rating}점`}</span>
        {visitSummary(restaurant) && <span>{visitSummary(restaurant)}</span>}
      </div>
      {restaurant.location && <p className="item-location">위치: {restaurant.location}</p>}
      {restaurant.memo && <p className="item-memo">{restaurant.memo}</p>}
    </li>
  )
}

export default RestaurantItem
