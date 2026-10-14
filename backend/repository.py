from datetime import datetime
from threading import Lock

from backend.schemas import Category, PriceRange, Restaurant, RestaurantCreate, VisitStatus

# 메모리 저장소. API를 재시작하면 데이터가 사라진다. (T11에서 DB로 교체)
_restaurants: dict[int, Restaurant] = {}
_next_id = 1
_lock = Lock()


def list_restaurants(
    q: str | None = None,
    category: Category | None = None,
    price_range: PriceRange | None = None,
    visit_status: VisitStatus | None = None,
) -> list[Restaurant]:
    """조건을 모두 만족하는(AND) 식당을 최신 등록순(created_at 내림차순, 같으면 id 내림차순)으로 돌려준다.

    q는 공백 제거 후 이름에 포함되는지 대소문자 구분 없이 비교한다. 빈 값이나 None은 조건에서 뺀다.
    """
    keyword = (q or "").strip().casefold()
    with _lock:
        items = list(_restaurants.values())
    matched = [
        r
        for r in items
        if (not keyword or keyword in r.name.casefold())
        and (category is None or r.category == category)
        and (price_range is None or r.price_range == price_range)
        and (visit_status is None or r.visit_status == visit_status)
    ]
    return sorted(matched, key=lambda r: (r.created_at, r.id), reverse=True)


def create_restaurant(data: RestaurantCreate) -> Restaurant:
    global _next_id
    with _lock:
        restaurant = Restaurant(
            id=_next_id,
            **data.model_dump(),
            visit_count=0,
            last_visited_at=None,
            created_at=datetime.now().replace(microsecond=0),
        )
        _restaurants[restaurant.id] = restaurant
        _next_id += 1
    return restaurant


def update_restaurant(restaurant_id: int, changes: dict) -> Restaurant | None:
    """changes에 담긴 필드만 바꾼다. 없는 id면 None."""
    with _lock:
        current = _restaurants.get(restaurant_id)
        if current is None:
            return None
        updated = current.model_copy(update=changes)
        _restaurants[restaurant_id] = updated
    return updated


def delete_restaurant(restaurant_id: int) -> bool:
    """삭제했으면 True, 없는 id면 False."""
    with _lock:
        return _restaurants.pop(restaurant_id, None) is not None
