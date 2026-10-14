const STORAGE_KEY = 'lunch-slot-v1'

function isValidRestaurant(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.createdAt === 'string'
  )
}

// 저장된 목록을 읽는다. 저장값이 없으면 빈 목록, 손상되었으면 ok: false를 돌려준다.
// 손상된 저장값은 여기서 지우거나 덮어쓰지 않는다.
export function loadRestaurants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ok: true, restaurants: [] }
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || !data.every(isValidRestaurant)) {
      return { ok: false, restaurants: [] }
    }
    return { ok: true, restaurants: data }
  } catch {
    return { ok: false, restaurants: [] }
  }
}

// 목록 전체를 저장한다. 저장에 실패하면 false를 돌려준다.
export function saveRestaurants(restaurants) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants))
    return true
  } catch {
    return false
  }
}
