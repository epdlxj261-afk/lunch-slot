from fastapi import FastAPI

from backend import repository
from backend.schemas import Restaurant, RestaurantCreate

app = FastAPI(title="오늘 뭐 먹지? API")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/restaurants", response_model=list[Restaurant])
def list_restaurants():
    return repository.list_restaurants()


@app.post("/api/restaurants", response_model=Restaurant, status_code=201)
def create_restaurant(data: RestaurantCreate):
    return repository.create_restaurant(data)
