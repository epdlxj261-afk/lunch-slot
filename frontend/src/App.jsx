import { useState } from 'react'
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
  const [restaurants, setRestaurants] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
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
    setRestaurants((prev) => [restaurant, ...prev])
    setName('')
    setError('')
  }

  return (
    <main className="app">
      <h1>오늘 뭐 먹지?</h1>

      <form className="register-form" onSubmit={handleSubmit}>
        <label htmlFor="restaurant-name">식당 이름</label>
        <div className="register-row">
          <input
            id="restaurant-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 국밥집"
          />
          <button type="submit">등록</button>
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
