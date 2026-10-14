from contextlib import contextmanager

from backend.database import get_connection
from backend.schemas import Category, PriceRange, Restaurant, RestaurantCreate, VisitStatus

# MariaDB 저장소. SQL에 값을 문자열로 이어 붙이지 않고 모두 %s 파라미터로 넘긴다.

COLUMNS = (
    "id, name, category, price_range, location, memo, visit_status, rating, "
    "visit_count, last_visited_at, created_at"
)
# PATCH로 바꿀 수 있는 컬럼. 컬럼 이름은 파라미터로 넘길 수 없으므로 이 목록에 있는 것만 SQL에 쓴다.
UPDATABLE_COLUMNS = ("name", "location", "memo")


@contextmanager
def _cursor():
    """연결을 열고 커서를 준다. 정상 종료 시 commit, 예외 시 rollback 후 연결을 닫는다."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _escape_like(text: str) -> str:
    """LIKE에서 %, _를 와일드카드가 아닌 글자로 찾도록 이스케이프한다(기본 이스케이프 문자는 \\)."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _fetch_one(cur, restaurant_id: int) -> Restaurant | None:
    cur.execute(f"SELECT {COLUMNS} FROM restaurants WHERE id = %s", (restaurant_id,))
    row = cur.fetchone()
    return Restaurant(**row) if row else None


def list_restaurants(
    q: str | None = None,
    category: Category | None = None,
    price_range: PriceRange | None = None,
    visit_status: VisitStatus | None = None,
) -> list[Restaurant]:
    """조건을 모두 만족하는(AND) 식당을 최신 등록순(created_at 내림차순, 같으면 id 내림차순)으로 돌려준다.

    q는 공백 제거 후 이름에 포함되는지 비교한다(테이블 정렬 규칙상 대소문자 구분 없음). 빈 값이나 None은 조건에서 뺀다.
    """
    conditions = []
    params = []
    keyword = (q or "").strip()
    if keyword:
        conditions.append("name LIKE %s")
        params.append(f"%{_escape_like(keyword)}%")
    if category is not None:
        conditions.append("category = %s")
        params.append(category.value)
    if price_range is not None:
        conditions.append("price_range = %s")
        params.append(price_range.value)
    if visit_status is not None:
        conditions.append("visit_status = %s")
        params.append(visit_status.value)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    with _cursor() as cur:
        cur.execute(
            f"SELECT {COLUMNS} FROM restaurants {where} ORDER BY created_at DESC, id DESC",
            params,
        )
        rows = cur.fetchall()
    return [Restaurant(**row) for row in rows]


def create_restaurant(data: RestaurantCreate) -> Restaurant:
    with _cursor() as cur:
        cur.execute(
            "INSERT INTO restaurants "
            "(name, category, price_range, location, memo, visit_status, rating) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                data.name,
                data.category.value,
                data.price_range.value,
                data.location,
                data.memo,
                data.visit_status.value,
                data.rating,
            ),
        )
        return _fetch_one(cur, cur.lastrowid)


def update_restaurant(restaurant_id: int, changes: dict) -> Restaurant | None:
    """changes에 담긴 필드만 바꾼다. 없는 id면 None."""
    columns = [column for column in UPDATABLE_COLUMNS if column in changes]
    with _cursor() as cur:
        if columns:
            assignments = ", ".join(f"{column} = %s" for column in columns)
            cur.execute(
                f"UPDATE restaurants SET {assignments} WHERE id = %s",
                [changes[column] for column in columns] + [restaurant_id],
            )
        # 값이 그대로면 UPDATE의 영향 행 수가 0일 수 있으므로 존재 여부는 다시 조회해 판단한다.
        return _fetch_one(cur, restaurant_id)


def delete_restaurant(restaurant_id: int) -> bool:
    """삭제했으면 True, 없는 id면 False."""
    with _cursor() as cur:
        cur.execute("DELETE FROM restaurants WHERE id = %s", (restaurant_id,))
        return cur.rowcount > 0
