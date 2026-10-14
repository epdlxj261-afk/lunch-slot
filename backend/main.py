from typing import Annotated

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.exceptions import RequestValidationError

from backend import repository
from backend.schemas import (
    Category,
    IsoDate,
    PriceRange,
    Restaurant,
    RestaurantCreate,
    RestaurantUpdate,
    VisitCreate,
    VisitStatus,
)

NOT_FOUND = "식당을 찾을 수 없습니다"
NO_CANDIDATE = "조건에 맞는 식당이 없습니다"

app = FastAPI(title="오늘 뭐 먹지? API")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/restaurants", response_model=list[Restaurant])
def list_restaurants(
    q: str | None = None,
    category: Category | None = None,
    price_range: PriceRange | None = None,
    visit_status: VisitStatus | None = None,
):
    return repository.list_restaurants(q, category, price_range, visit_status)


@app.post("/api/restaurants", response_model=Restaurant, status_code=201)
def create_restaurant(data: RestaurantCreate):
    return repository.create_restaurant(data)


@app.patch("/api/restaurants/{restaurant_id}", response_model=Restaurant)
def update_restaurant(restaurant_id: int, data: RestaurantUpdate):
    # 보낸 필드만 바꾸고 보내지 않은 필드는 유지한다.
    restaurant = repository.update_restaurant(restaurant_id, data.model_dump(exclude_unset=True))
    if restaurant is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return restaurant


@app.post("/api/restaurants/{restaurant_id}/visits", response_model=Restaurant)
def record_visit(restaurant_id: int, data: VisitCreate):
    restaurant = repository.record_visit(restaurant_id, data.visited_on, data.rating)
    if restaurant is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return restaurant


@app.get("/api/recommendations/random", response_model=Restaurant)
def random_recommendation(
    category: Category | None = None,
    price_range: PriceRange | None = None,
    visit_status: VisitStatus | None = None,
    exclude_days: Annotated[int | None, Query(ge=1, le=30)] = None,
    today: IsoDate | None = None,
):
    # 최근 방문 제외는 브라우저 로컬 날짜(today) 기준으로 계산하므로 함께 보내야 한다.
    if exclude_days is not None and today is None:
        raise RequestValidationError(
            [
                {
                    "type": "missing",
                    "loc": ("query", "today"),
                    "msg": "exclude_days를 보낼 때 today(YYYY-MM-DD)가 필요합니다",
                    "input": None,
                }
            ]
        )
    restaurant = repository.random_restaurant(
        category, price_range, visit_status, exclude_days, today
    )
    if restaurant is None:
        raise HTTPException(status_code=404, detail=NO_CANDIDATE)
    return restaurant


@app.delete("/api/restaurants/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id: int):
    if not repository.delete_restaurant(restaurant_id):
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return Response(status_code=204)
