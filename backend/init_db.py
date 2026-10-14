"""restaurants 테이블을 만든다. 이미 있으면 그대로 두고 데이터도 지우지 않는다.

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


def main() -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES LIKE 'restaurants'")
            existed = cur.fetchone() is not None
            cur.execute(CREATE_RESTAURANTS)
        conn.commit()
    finally:
        conn.close()
    if existed:
        print("restaurants 테이블이 이미 있습니다. 변경하지 않았습니다.")
    else:
        print("restaurants 테이블을 만들었습니다.")


if __name__ == "__main__":
    main()
