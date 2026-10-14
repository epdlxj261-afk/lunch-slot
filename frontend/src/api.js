// 백엔드 API(/api) 호출. 서버 필드(snake_case)와 화면 필드(camelCase)는 여기서만 변환한다.

const BASE_URL = '/api'

export const CONNECTION_ERROR_MESSAGE = '서버에 연결할 수 없습니다'

const FIELD_LABELS = {
  name: '식당 이름',
  category: '카테고리',
  price_range: '가격대',
  location: '위치',
  memo: '메모',
  visit_status: '방문 상태',
  rating: '평점',
  visited_on: '방문 날짜',
  exclude_days: '제외 일수',
  today: '오늘 날짜',
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// 422 응답의 첫 번째 오류에서 필드 이름을 찾아 한국어 안내로 바꾼다.
function validationMessage(detail) {
  const field = Array.isArray(detail) ? detail[0]?.loc?.at(-1) : undefined
  const label = FIELD_LABELS[field]
  return label ? `${label} 값이 올바르지 않습니다.` : '입력값이 올바르지 않습니다.'
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError(CONNECTION_ERROR_MESSAGE, 0)
  }

  if (response.status === 204) return null

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (response.ok) return body
  // 개발 서버 프록시는 API가 꺼져 있으면 본문 없는 500을 돌려준다.
  if ([502, 503, 504].includes(response.status) || (response.status === 500 && body === null)) {
    throw new ApiError(CONNECTION_ERROR_MESSAGE, response.status)
  }
  if (response.status === 422) {
    throw new ApiError(validationMessage(body?.detail), 422)
  }
  if (typeof body?.detail === 'string') {
    throw new ApiError(body.detail, response.status)
  }
  throw new ApiError('서버 오류가 발생했습니다. 다시 시도하세요.', response.status)
}

function fromServer(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    priceRange: item.price_range,
    location: item.location,
    memo: item.memo,
    visitStatus: item.visit_status,
    rating: item.rating,
    visitCount: item.visit_count,
    lastVisitedAt: item.last_visited_at,
    createdAt: item.created_at,
  }
}

// filters의 빈 값은 "전체"이므로 쿼리에서 뺀다.
export async function listRestaurants(filters) {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.category) params.set('category', filters.category)
  if (filters.priceRange) params.set('price_range', filters.priceRange)
  if (filters.visitStatus) params.set('visit_status', filters.visitStatus)
  const query = params.toString()
  const items = await request(`/restaurants${query ? `?${query}` : ''}`)
  return items.map(fromServer)
}

// 조건(카테고리·가격대·방문 상태)에 맞는 식당 1곳을 서버가 무작위로 고른다.
// excludeDays가 있으면 today(브라우저 로컬 날짜) 기준 최근 N일 이내 방문한 식당을 뺀다.
// 후보가 없으면 서버의 404 안내("조건에 맞는 식당이 없습니다")가 ApiError로 전달된다.
export async function getRandomRecommendation(conditions, { excludeDays = null, today = null } = {}) {
  const params = new URLSearchParams()
  if (conditions.category) params.set('category', conditions.category)
  if (conditions.priceRange) params.set('price_range', conditions.priceRange)
  if (conditions.visitStatus) params.set('visit_status', conditions.visitStatus)
  if (excludeDays !== null) {
    params.set('exclude_days', String(excludeDays))
    params.set('today', today)
  }
  const query = params.toString()
  const item = await request(`/recommendations/random${query ? `?${query}` : ''}`)
  return fromServer(item)
}

export async function createRestaurant(values) {
  const item = await request('/restaurants', {
    method: 'POST',
    body: JSON.stringify({
      name: values.name,
      category: values.category,
      price_range: values.priceRange,
      location: values.location,
      memo: values.memo,
      visit_status: values.visitStatus,
      rating: values.rating,
    }),
  })
  return fromServer(item)
}

// 이름·위치·메모만 보낸다.
export async function updateRestaurant(id, { name, location, memo }) {
  const item = await request(`/restaurants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, location, memo }),
  })
  return fromServer(item)
}

// "여기로 결정": visitedOn(브라우저 로컬 날짜 YYYY-MM-DD)으로 방문을 기록한다.
// rating이 null이면 서버가 기존 평점을 유지한다.
export async function recordVisit(id, { visitedOn, rating }) {
  const item = await request(`/restaurants/${id}/visits`, {
    method: 'POST',
    body: JSON.stringify({ visited_on: visitedOn, rating }),
  })
  return fromServer(item)
}

export async function deleteRestaurant(id) {
  await request(`/restaurants/${id}`, { method: 'DELETE' })
}
