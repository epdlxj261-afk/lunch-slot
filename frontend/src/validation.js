import {
  LOCATION_MAX_LENGTH,
  MEMO_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_PATTERN,
  textLength,
} from './constants.js'

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

// 아이디는 서버와 같게 공백 제거·소문자로 바꾼 값을 받는다.
export function validateUsername(username) {
  if (username === '') return '아이디를 입력하세요.'
  if (!USERNAME_PATTERN.test(username)) {
    return '아이디는 영문 소문자·숫자·밑줄(_) 4~20자로 입력하세요.'
  }
  return null
}

// 비밀번호는 앞뒤 공백도 비밀번호의 일부로 보아 그대로 검사한다.
export function validatePassword(password) {
  const length = textLength(password)
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자로 입력하세요.`
  }
  return null
}
