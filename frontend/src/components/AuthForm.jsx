import { useState } from 'react'
import { login, signup } from '../api.js'
import { validatePassword, validateUsername } from '../validation.js'

const MODES = {
  login: { title: '로그인', submit: '로그인', switchText: '계정이 없나요?', switchLabel: '회원가입' },
  signup: { title: '회원가입', submit: '가입하기', switchText: '이미 계정이 있나요?', switchLabel: '로그인' },
}

// 로그인·회원가입 폼. 성공하면 서버가 세션 쿠키를 보내고 onAuthenticated(user)를 부른다.
// notice는 세션 만료 등으로 로그인 화면에 돌아왔을 때의 안내다.
// 비밀번호는 이 컴포넌트의 상태에만 두고 어디에도 저장하지 않는다.
function AuthForm({ onAuthenticated, notice }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // 요청 중에는 폼을 잠가 중복 요청을 막는다.
  const [submitting, setSubmitting] = useState(false)

  const text = MODES[mode]

  function switchMode() {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
    setPassword('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const normalized = username.trim().toLowerCase()
    // 가입은 서버와 같은 규칙으로 미리 안내하고, 로그인은 빈 값만 확인한다(일치 여부는 서버가 판단).
    const message =
      mode === 'signup'
        ? (validateUsername(normalized) ?? validatePassword(password))
        : normalized === '' || password === ''
          ? '아이디와 비밀번호를 입력하세요.'
          : null
    if (message) {
      setError(message)
      return
    }
    setSubmitting(true)
    try {
      const send = mode === 'signup' ? signup : login
      const user = await send({ username: normalized, password })
      setPassword('')
      onAuthenticated(user)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form className="register-form auth-form" onSubmit={handleSubmit}>
      <fieldset disabled={submitting}>
        <legend>{text.title}</legend>
        {notice && !error && <p className="auth-notice">{notice}</p>}

        <div className="field">
          <label htmlFor="auth-username">아이디</label>
          <input
            id="auth-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={64}
            placeholder={mode === 'signup' ? '영문 소문자·숫자·_ 4~20자' : ''}
          />
        </div>

        <div className="field">
          <label htmlFor="auth-password">비밀번호</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={mode === 'signup' ? '8~64자' : ''}
          />
        </div>

        <button type="submit" className="primary">
          {submitting ? '처리 중...' : text.submit}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="auth-switch">
          {text.switchText}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {text.switchLabel}
          </button>
        </p>
      </fieldset>
    </form>
  )
}

export default AuthForm
