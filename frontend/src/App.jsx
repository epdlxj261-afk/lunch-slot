import { useEffect, useState } from 'react'
import { createRestaurant, deleteRestaurant, listRestaurants, updateRestaurant } from './api.js'
import { EMPTY_FILTERS } from './constants.js'
import { validateEditable } from './validation.js'
import RegisterForm from './components/RegisterForm.jsx'
import FilterBar from './components/FilterBar.jsx'
import RestaurantItem from './components/RestaurantItem.jsx'
import Recommendation from './components/Recommendation.jsx'
import './App.css'

function hasActiveFilters(filters) {
  return (
    filters.q.trim() !== '' ||
    filters.category !== '' ||
    filters.priceRange !== '' ||
    filters.visitStatus !== ''
  )
}

function trimEditable(values) {
  return {
    name: values.name.trim(),
    location: values.location.trim(),
    memo: values.memo.trim(),
  }
}

function App() {
  const [restaurants, setRestaurants] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [loading, setLoading] = useState(true)
  // 목록을 불러오지 못했을 때의 안내(예: 서버에 연결할 수 없습니다)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  // 값을 바꾸면 현재 필터로 목록을 다시 불러온다(등록·수정·삭제 후, 다시 시도).
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // 필터를 빠르게 바꿀 때 늦게 도착한 이전 응답이 화면을 덮지 않도록 마지막 요청만 반영한다.
    let ignore = false
    listRestaurants(filters)
      .then((items) => {
        if (ignore) return
        setRestaurants(items)
        setLoadError('')
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [filters, reloadKey])

  function reload() {
    setReloadKey((key) => key + 1)
  }

  // 실패하면 오류 메시지, 성공하면 null을 돌려준다.
  async function handleRegister(values) {
    const editable = trimEditable(values)
    const message = validateEditable(editable)
    if (message) return message
    try {
      await createRestaurant({ ...values, ...editable })
    } catch (err) {
      return err.message
    }
    reload()
    return null
  }

  // id가 같은 식당의 이름·위치·메모만 바꾼다. 실패하면 오류 메시지, 성공하면 null을 돌려준다.
  async function handleUpdate(id, values) {
    const editable = trimEditable(values)
    const message = validateEditable(editable)
    if (message) return message
    try {
      await updateRestaurant(id, editable)
    } catch (err) {
      return err.message
    }
    reload()
    return null
  }

  // 확인을 받은 뒤 id가 같은 식당만 삭제한다. 취소하면 아무것도 바꾸지 않는다.
  async function handleDelete(id) {
    const target = restaurants.find((restaurant) => restaurant.id === id)
    if (!target) return
    if (!window.confirm(`"${target.name}"을(를) 삭제할까요?`)) return
    try {
      await deleteRestaurant(id)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    reload()
  }

  const filtered = hasActiveFilters(filters)

  return (
    <main className="app">
      <h1>오늘 뭐 먹지?</h1>

      <Recommendation onVisited={reload} />

      <RegisterForm onRegister={handleRegister} />

      <section>
        <h2>식당 목록 ({restaurants.length})</h2>
        <FilterBar filters={filters} onChange={setFilters} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loadError ? (
          <div className="load-error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={reload}>
              다시 시도
            </button>
          </div>
        ) : loading ? (
          <p className="empty">불러오는 중...</p>
        ) : restaurants.length === 0 ? (
          <p className="empty">
            {filtered ? '검색 조건에 맞는 식당이 없습니다.' : '등록된 식당이 없습니다.'}
          </p>
        ) : (
          <ul className="restaurant-list">
            {restaurants.map((restaurant) => (
              <RestaurantItem
                key={restaurant.id}
                restaurant={restaurant}
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
