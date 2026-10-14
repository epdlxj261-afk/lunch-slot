import { LOCATION_MAX_LENGTH, MEMO_MAX_LENGTH, NAME_MAX_LENGTH, textLength } from './constants.js'

// 각 함수는 공백 제거된 값을 받아 문제가 있으면 오류 메시지, 없으면 null을 돌려준다.

export function validateName(name) {
  const length = textLength(name)
  if (length === 0) return '식당 이름을 입력하세요.'
  if (length > NAME_MAX_LENGTH) return `식당 이름은 ${NAME_MAX_LENGTH}자 이하로 입력하세요.`
  return null
}

export function validateLocation(location) {
  if (textLength(location) > LOCATION_MAX_LENGTH) {
    return `위치는 ${LOCATION_MAX_LENGTH}자 이하로 입력하세요.`
  }
  return null
}

export function validateMemo(memo) {
  if (textLength(memo) > MEMO_MAX_LENGTH) return `메모는 ${MEMO_MAX_LENGTH}자 이하로 입력하세요.`
  return null
}

// 이름·위치·메모를 차례로 검사해 첫 번째 오류를 돌려준다.
export function validateEditable({ name, location, memo }) {
  return validateName(name) ?? validateLocation(location) ?? validateMemo(memo)
}
