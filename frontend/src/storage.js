import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  DEFAULT_PRICE_RANGE,
  DEFAULT_VISIT_STATUS,
  PRICE_RANGES,
  VISIT_STATUSES,
  isOptionValue,
  isValidRating,
} from './constants.js'

const STORAGE_KEY = 'lunch-slot-v1'

// 이전 단계(T01~T03)에서 저장한 항목에는 새 필드가 없으므로 기본값으로 채운다.
// 필드가 있는데 값이 잘못되었으면 손상으로 보고 null을 돌려준다.
function normalizeRestaurant(item) {
  if (
    item === null ||
    typeof item !== 'object' ||
    typeof item.id !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.createdAt !== 'string'
  ) {
    return null
  }
  const restaurant = {
    id: item.id,
    name: item.name,
    category: item.category ?? DEFAULT_CATEGORY,
    priceRange: item.priceRange ?? DEFAULT_PRICE_RANGE,
    location: item.location ?? '',
    memo: item.memo ?? '',
    visitStatus: item.visitStatus ?? DEFAULT_VISIT_STATUS,
    rating: item.rating ?? null,
    createdAt: item.createdAt,
  }
  if (
    !isOptionValue(CATEGORIES, restaurant.category) ||
    !isOptionValue(PRICE_RANGES, restaurant.priceRange) ||
    typeof restaurant.location !== 'string' ||
    typeof restaurant.memo !== 'string' ||
    !isOptionValue(VISIT_STATUSES, restaurant.visitStatus) ||
    !isValidRating(restaurant.rating)
  ) {
    return null
  }
  return restaurant
}

// 저장된 목록을 읽는다. 저장값이 없으면 빈 목록, 손상되었으면 ok: false를 돌려준다.
// 손상된 저장값은 여기서 지우거나 덮어쓰지 않는다.
export function loadRestaurants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ok: true, restaurants: [] }
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return { ok: false, restaurants: [] }
    const restaurants = data.map(normalizeRestaurant)
    if (restaurants.includes(null)) return { ok: false, restaurants: [] }
    return { ok: true, restaurants }
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
