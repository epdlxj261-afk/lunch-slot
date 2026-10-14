import { useState } from 'react'
import { EMPTY_FILTERS } from './constants.js'
import { loadRestaurants, saveRestaurants } from './storage.js'
import { validateEditable } from './validation.js'
import RegisterForm from './components/RegisterForm.jsx'
import FilterBar from './components/FilterBar.jsx'
import RestaurantItem from './components/RestaurantItem.jsx'
import './App.css'

// 검색어와 필터를 모두 만족하는(AND) 식당만 남긴다. 빈 값은 조건에서 뺀다.
function filterRestaurants(restaurants, filters) {
  const q = filters.q.trim().toLowerCase()
  return restaurants.filter(
    (restaurant) =>
      (q === '' || restaurant.name.toLowerCase().includes(q)) &&
      (filters.category === '' || restaurant.category === filters.category) &&
      (filters.priceRange === '' || restaurant.priceRange === filters.priceRange) &&
      (filters.visitStatus === '' || restaurant.visitStatus === filters.visitStatus),
  )
}

function App() {
  const [initial] = useState(loadRestaurants)
  const [restaurants, setRestaurants] = useState(initial.restaurants)
  // 저장값이 손상되면 true. 초기화 전까지 등록·저장을 막는다.
  const [storageBroken, setStorageBroken] = useState(!initial.ok)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [error, setError] = useState('')

  // 실패하면 오류 메시지, 성공하면 null을 돌려준다.
  function handleRegister(values) {
    if (storageBroken) return '저장된 데이터를 읽을 수 없어 등록할 수 없습니다.'
    const editable = {
      name: values.name.trim(),
      location: values.location.trim(),
      memo: values.memo.trim(),
    }
    const message = validateEditable(editable)
    if (message) return message
    const restaurant = {
      id: crypto.randomUUID(),
      ...editable,
      category: values.category,
      priceRange: values.priceRange,
      visitStatus: values.visitStatus,
      rating: values.rating,
      createdAt: new Date().toISOString(),
    }
    // 최신 등록순으로 보이도록 앞에 추가한다.
    const next = [restaurant, ...restaurants]
    if (!saveRestaurants(next)) return '저장하지 못했습니다. 다시 시도하세요.'
    setRestaurants(next)
    return null
  }

  // id가 같은 식당의 이름·위치·메모만 바꾼다. 실패하면 오류 메시지, 성공하면 null을 돌려준다.
  function handleUpdate(id, values) {
    if (storageBroken) return '저장된 데이터를 읽을 수 없어 수정할 수 없습니다.'
    const editable = {
      name: values.name.trim(),
      location: values.location.trim(),
      memo: values.memo.trim(),
    }
    const message = validateEditable(editable)
    if (message) return message
    const next = restaurants.map((restaurant) =>
      restaurant.id === id ? { ...restaurant, ...editable } : restaurant,
    )
    if (!saveRestaurants(next)) return '저장하지 못했습니다. 다시 시도하세요.'
    setRestaurants(next)
    return null
  }

  // 확인을 받은 뒤 id가 같은 식당만 삭제한다. 취소하면 아무것도 바꾸지 않는다.
  function handleDelete(id) {
    if (storageBroken) return
    const target = restaurants.find((restaurant) => restaurant.id === id)
    if (!target) return
    if (!window.confirm(`"${target.name}"을(를) 삭제할까요?`)) return
    const next = restaurants.filter((restaurant) => restaurant.id !== id)
    if (!saveRestaurants(next)) {
      setError('삭제하지 못했습니다. 다시 시도하세요.')
      return
    }
    setRestaurants(next)
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

  const visibleRestaurants = filterRestaurants(restaurants, filters)

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

      <RegisterForm disabled={storageBroken} onRegister={handleRegister} />

      <section>
        <h2>
          식당 목록 ({visibleRestaurants.length}/{restaurants.length})
        </h2>
        <FilterBar filters={filters} onChange={setFilters} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {restaurants.length === 0 ? (
          <p className="empty">등록된 식당이 없습니다.</p>
        ) : visibleRestaurants.length === 0 ? (
          <p className="empty">검색 조건에 맞는 식당이 없습니다.</p>
        ) : (
          <ul className="restaurant-list">
            {visibleRestaurants.map((restaurant) => (
              <RestaurantItem
                key={restaurant.id}
                restaurant={restaurant}
                disabled={storageBroken}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
