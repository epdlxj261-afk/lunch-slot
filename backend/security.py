import base64
import hashlib
import hmac
import secrets

# 비밀번호 해시와 세션 값을 다룬다. 원문 비밀번호·세션 값은 반환값 외에 저장하거나 출력하지 않는다.

# scrypt 매개변수. 저장 문자열에 함께 기록하므로 나중에 바꿔도 기존 해시를 검증할 수 있다.
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64
SALT_BYTES = 16


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _scrypt(password: str, salt: bytes, n: int, r: int, p: int, dklen: int) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=n, r=r, p=p, dklen=dklen, maxmem=64 * 1024 * 1024
    )


def hash_password(password: str) -> str:
    """무작위 솔트로 scrypt 해시를 만든다. 형식: scrypt$n$r$p$솔트(base64)$해시(base64)"""
    salt = secrets.token_bytes(SALT_BYTES)
    digest = _scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, SCRYPT_DKLEN)
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    """저장된 해시와 비교한다. 형식이 잘못된 값은 일치하지 않는 것으로 본다."""
    try:
        scheme, n, r, p, salt_b64, digest_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        salt = base64.b64decode(salt_b64, validate=True)
        expected = base64.b64decode(digest_b64, validate=True)
        actual = _scrypt(password, salt, int(n), int(r), int(p), len(expected))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)


# 없는 아이디로 로그인할 때도 같은 시간만큼 해시를 계산해 응답 시간으로 아이디 존재 여부가 드러나지 않게 한다.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def burn_password_check(password: str) -> None:
    verify_password(password, _DUMMY_HASH)


def new_session_token() -> str:
    """쿠키에 넣을 세션 값(추측할 수 없는 무작위 32바이트)."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """DB에 저장·조회할 세션 값의 SHA-256 해시(16진수 64자)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
