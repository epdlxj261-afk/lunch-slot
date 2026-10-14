from datetime import datetime
from threading import Lock

from backend.schemas import Restaurant, RestaurantCreate

# 메모리 저장소. API를 재시작하면 데이터가 사라진다. (T11에서 DB로 교체)
_restaurants: dict[int, Restaurant] = {}
_next_id = 1
_lock = Lock()


def list_restaurants() -> list[Restaurant]:
    """최신 등록순(created_at 내림차순, 같으면 id 내림차순)으로 돌려준다."""
    with _lock:
        items = list(_restaurants.values())
    return sorted(items, key=lambda r: (r.created_at, r.id), reverse=True)


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
