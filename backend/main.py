from fastapi import FastAPI, HTTPException, Response

from backend import repository
from backend.schemas import (
    Category,
    PriceRange,
    Restaurant,
    RestaurantCreate,
    RestaurantUpdate,
    VisitStatus,
)

NOT_FOUND = "식당을 찾을 수 없습니다"

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


@app.delete("/api/restaurants/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id: int):
    if not repository.delete_restaurant(restaurant_id):
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return Response(status_code=204)
