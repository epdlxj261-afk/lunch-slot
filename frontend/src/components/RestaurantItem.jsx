import { useState } from 'react'

// 목록의 식당 한 곳. 수정·삭제는 모두 restaurant.id 기준으로 상위에 요청한다.
function RestaurantItem({ restaurant, disabled, onUpdateName, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  function startEdit() {
    setEditName(restaurant.name)
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  function handleSave(event) {
    event.preventDefault()
    // 실패하면 오류 메시지, 성공하면 null을 받는다.
    const message = onUpdateName(restaurant.id, editName)
    if (message) {
      setError(message)
      return
    }
    setEditing(false)
    setError('')
  }

  if (editing) {
    const inputId = `edit-name-${restaurant.id}`
    return (
      <li>
        <form className="edit-form" onSubmit={handleSave}>
          <label htmlFor={inputId} className="visually-hidden">
            식당 이름 수정
          </label>
          <div className="item-row">
            <input
              id={inputId}
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              autoFocus
            />
            <button type="submit" disabled={disabled}>
              저장
            </button>
            <button type="button" onClick={cancelEdit}>
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
        <button type="button" onClick={startEdit} disabled={disabled}>
          수정
        </button>
        <button type="button" onClick={() => onDelete(restaurant.id)} disabled={disabled}>
          삭제
        </button>
      </div>
    </li>
  )
}

export default RestaurantItem
