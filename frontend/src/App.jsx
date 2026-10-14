import { useState } from 'react'
import { loadRestaurants, saveRestaurants } from './storage.js'
import './App.css'

const NAME_MAX_LENGTH = 50

// 공백 제거 후 1~50자인지 검사한다. 문제가 없으면 null을 돌려준다.
function validateName(name) {
  const length = Array.from(name).length
  if (length === 0) return '식당 이름을 입력하세요.'
  if (length > NAME_MAX_LENGTH) return `식당 이름은 ${NAME_MAX_LENGTH}자 이하로 입력하세요.`
  return null
}

function App() {
  const [initial] = useState(loadRestaurants)
  const [restaurants, setRestaurants] = useState(initial.restaurants)
  // 저장값이 손상되면 true. 초기화 전까지 등록·저장을 막는다.
  const [storageBroken, setStorageBroken] = useState(!initial.ok)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (storageBroken) return
    const trimmed = name.trim()
    const message = validateName(trimmed)
    if (message) {
      setError(message)
      return
    }
    const restaurant = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    // 최신 등록순으로 보이도록 앞에 추가한다.
    const next = [restaurant, ...restaurants]
    if (!saveRestaurants(next)) {
      setError('저장하지 못했습니다. 다시 시도하세요.')
      return
    }
    setRestaurants(next)
    setName('')
    setError('')
  }

  function handleReset() {
    if (!window.confirm('저장된 데이터를 모두 지우고 빈 목록으로 초기화할까요?')) return
    if (!saveRestaurants([])) {
      setError('초기화하지 못했습니다. 다시 시도하세요.')
      return
    }
    setRestaurants([])
    setStorageBroken(false)
    setError('')
  }

  return (
    <main className="app">
      <h1>오늘 뭐 먹지?</h1>

      {storageBroken && (
        <div className="storage-error" role="alert">
          <p>저장된 데이터를 읽을 수 없습니다</p>
          <button type="button" onClick={handleReset}>
            초기화
          </button>
        </div>
      )}

      <form className="register-form" onSubmit={handleSubmit}>
        <label htmlFor="restaurant-name">식당 이름</label>
        <div className="register-row">
          <input
            id="restaurant-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 국밥집"
            disabled={storageBroken}
          />
          <button type="submit" disabled={storageBroken}>
            등록
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>

      <section>
        <h2>식당 목록 ({restaurants.length})</h2>
        {restaurants.length === 0 ? (
          <p className="empty">등록된 식당이 없습니다.</p>
        ) : (
          <ul className="restaurant-list">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>{restaurant.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
