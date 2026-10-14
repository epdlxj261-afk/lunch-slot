export const NAME_MAX_LENGTH = 50
export const LOCATION_MAX_LENGTH = 100
export const MEMO_MAX_LENGTH = 500

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

// 글자 수는 이모지 등도 1자로 세도록 코드 포인트 기준으로 센다.
export function textLength(text) {
  return Array.from(text).length
}
