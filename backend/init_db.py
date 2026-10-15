"""DB 테이블을 만든다. 이미 있는 테이블·데이터는 지우지 않고, 없는 테이블·칼럼만 추가한다.

실행: 프로젝트 루트에서 python -m backend.init_db
"""

from backend.database import get_connection

CREATE_RESTAURANTS = """
CREATE TABLE IF NOT EXISTS restaurants (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    category ENUM('KOREAN', 'CHINESE', 'JAPANESE', 'WESTERN', 'SNACK', 'CAFE', 'ETC')
        NOT NULL DEFAULT 'ETC',
    price_range ENUM('LOW', 'MID', 'HIGH') NOT NULL DEFAULT 'MID',
    location VARCHAR(100) NOT NULL DEFAULT '',
    memo VARCHAR(500) NOT NULL DEFAULT '',
    visit_status ENUM('WANT', 'VISITED') NOT NULL DEFAULT 'WANT',
    rating TINYINT UNSIGNED NULL DEFAULT NULL,
    visit_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_visited_at DATE NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_restaurants_created (created_at, id),
    CONSTRAINT chk_restaurants_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

# 아이디는 소문자로 바꿔 저장한다. 고유 제약으로 중복 가입을 막는다.
# password_hash에는 원문 없이 scrypt 해시와 솔트·매개변수만 저장한다.
CREATE_USERS = """
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    CONSTRAINT chk_users_username CHECK (username REGEXP '^[a-z0-9_]{4,20}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

# 세션 값 원문은 브라우저 쿠키에만 두고, DB에는 SHA-256 해시(16진수 64자)만 저장한다.
CREATE_SESSIONS = """
CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    PRIMARY KEY (token_hash),
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_expires (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

# restaurants에 등록한 사용자(user_id)를 추가한다. 로그인 도입 전 식당은 NULL로 남는다.
# (이름, 확인 SQL, 추가 SQL) 순서대로 없을 때만 실행한다.
RESTAURANTS_USER_CHANGES = (
    (
        "user_id 칼럼",
        "SELECT 1 FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'restaurants' AND COLUMN_NAME = 'user_id'",
        "ALTER TABLE restaurants ADD COLUMN user_id INT UNSIGNED NULL DEFAULT NULL AFTER id",
    ),
    (
        "idx_restaurants_user 인덱스",
        "SELECT 1 FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'restaurants' "
        "AND INDEX_NAME = 'idx_restaurants_user'",
        "ALTER TABLE restaurants ADD KEY idx_restaurants_user (user_id, created_at, id)",
    ),
    (
        "fk_restaurants_user 외래키",
        "SELECT 1 FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'restaurants' "
        "AND CONSTRAINT_NAME = 'fk_restaurants_user'",
        "ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_user "
        "FOREIGN KEY (user_id) REFERENCES users (id)",
    ),
)


def _table_exists(cur, name: str) -> bool:
    cur.execute("SHOW TABLES LIKE %s", (name,))
    return cur.fetchone() is not None


def main() -> None:
    messages = []
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 외래키 대상(users)을 restaurants·sessions보다 먼저 만든다.
            for name, sql in (
                ("users", CREATE_USERS),
                ("restaurants", CREATE_RESTAURANTS),
                ("sessions", CREATE_SESSIONS),
            ):
                existed = _table_exists(cur, name)
                cur.execute(sql)
                messages.append(f"{name} 테이블: " + ("이미 있습니다." if existed else "만들었습니다."))
            for label, check_sql, alter_sql in RESTAURANTS_USER_CHANGES:
                cur.execute(check_sql)
                if cur.fetchone() is not None:
                    messages.append(f"restaurants {label}: 이미 있습니다.")
                else:
                    cur.execute(alter_sql)
                    messages.append(f"restaurants {label}: 추가했습니다.")
        conn.commit()
    finally:
        conn.close()
    print("\n".join(messages))


if __name__ == "__main__":
    main()
