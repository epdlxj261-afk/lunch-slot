export const NAME_MAX_LENGTH = 50
export const LOCATION_MAX_LENGTH = 100
export const MEMO_MAX_LENGTH = 500
// 아이디: 공백 제거·소문자 변환 후 영문 소문자·숫자·밑줄 4~20자. 비밀번호: 8~64자(공백 포함).
export const USERNAME_PATTERN = /^[a-z0-9_]{4,20}$/
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64

export const CATEGORIES = [
  { value: 'KOREAN', label: '한식' },
  { value: 'CHINESE', label: '중식' },
  { value: 'JAPANESE', label: '일식' },
  { value: 'WESTERN', label: '양식' },
  { value: 'SNACK', label: '분식' },
  { value: 'CAFE', label: '카페' },
  { value: 'ETC', label: '기타' },
]

export const PRICE_RANGES = [
  { value: 'LOW', label: '~1만 원' },
  { value: 'MID', label: '1~2만 원' },
  { value: 'HIGH', label: '2만 원~' },
]

export const VISIT_STATUSES = [
  { value: 'WANT', label: '가보고 싶음' },
  { value: 'VISITED', label: '가봤음' },
]

export const RATINGS = [1, 2, 3, 4, 5]

// 최근 방문 제외 일수(N). 옵션을 켜면 기본값 3, 1~30만 허용한다.
export const DEFAULT_EXCLUDE_DAYS = 3
export const EXCLUDE_DAYS_MIN = 1
export const EXCLUDE_DAYS_MAX = 30

export const DEFAULT_CATEGORY = 'ETC'
export const DEFAULT_PRICE_RANGE = 'MID'
export const DEFAULT_VISIT_STATUS = 'WANT'

// 목록 필터 초기값. 빈 문자열은 "전체"를 뜻한다.
export const EMPTY_FILTERS = { q: '', category: '', priceRange: '', visitStatus: '' }

export function labelOf(options, value) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function isOptionValue(options, value) {
  return options.some((option) => option.value === value)
}

export function isValidRating(rating) {
  return rating === null || (Number.isInteger(rating) && rating >= 1 && rating <= 5)
}

// 브라우저 로컬 달력 기준 오늘 날짜(YYYY-MM-DD). toISOString은 UTC라 날짜가 어긋날 수 있어 쓰지 않는다.
export function localToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// 방문 기록 요약. 방문한 적이 없으면 null.
export function visitSummary(restaurant) {
  if (!restaurant.visitCount) return null
  return `방문 ${restaurant.visitCount}회 · 마지막 ${restaurant.lastVisitedAt}`
}

// 글자 수는 이모지 등도 1자로 세도록 코드 포인트 기준으로 센다.
export function textLength(text) {
  return Array.from(text).length
}
