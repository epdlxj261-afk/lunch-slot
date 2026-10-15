from typing import Annotated

from fastapi import Cookie, Depends, FastAPI, HTTPException, Query, Response
from fastapi.exceptions import RequestValidationError

from backend import repository, security
from backend.schemas import (
    Category,
    IsoDate,
    LoginRequest,
    PriceRange,
    Restaurant,
    RestaurantCreate,
    RestaurantUpdate,
    SignupRequest,
    User,
    VisitCreate,
    VisitStatus,
)

NOT_FOUND = "식당을 찾을 수 없습니다"
NO_CANDIDATE = "조건에 맞는 식당이 없습니다"
LOGIN_REQUIRED = "로그인이 필요합니다"
LOGIN_FAILED = "아이디 또는 비밀번호가 올바르지 않습니다"
USERNAME_TAKEN = "이미 사용 중인 아이디입니다"

# 세션 쿠키. JavaScript에서 읽을 수 없게(HttpOnly) 하고 /api 요청에만 보낸다.
# HTTP로 운영하므로 Secure는 붙이지 않는다(HTTPS 도입 시 secure=True).
SESSION_COOKIE = "ls_session"
SESSION_MAX_AGE = repository.SESSION_DAYS * 24 * 60 * 60
COOKIE_OPTIONS = {"path": "/api", "httponly": True, "samesite": "lax", "secure": False}

app = FastAPI(title="오늘 뭐 먹지? API")


@app.get("/api/health")
def health():
    return {"status": "ok"}


def current_user(
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> User:
    """유효한 세션 쿠키의 사용자. 없거나 만료·로그아웃된 세션이면 401."""
    if session_token:
        user = repository.find_session_user(security.hash_session_token(session_token))
        if user is not None:
            return user
    raise HTTPException(status_code=401, detail=LOGIN_REQUIRED)


def _start_session(response: Response, user_id: int, old_token: str | None) -> None:
    """새 세션을 만들어 쿠키로 보낸다. 이전 세션 쿠키가 있으면 그 세션은 지운다."""
    if old_token:
        repository.delete_session(security.hash_session_token(old_token))
    token = security.new_session_token()
    repository.create_session(security.hash_session_token(token), user_id)
    response.set_cookie(SESSION_COOKIE, token, max_age=SESSION_MAX_AGE, **COOKIE_OPTIONS)


@app.post("/api/auth/signup", response_model=User, status_code=201)
def signup(
    data: SignupRequest,
    response: Response,
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
):
    user = repository.create_user(data.username, security.hash_password(data.password))
    if user is None:
        raise HTTPException(status_code=409, detail=USERNAME_TAKEN)
    _start_session(response, user.id, session_token)
    return user


@app.post("/api/auth/login", response_model=User)
def login(
    data: LoginRequest,
    response: Response,
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
):
    # 아이디가 없을 때와 비밀번호가 틀릴 때 같은 응답·비슷한 시간이 걸리게 한다.
    found = repository.find_user_credentials(data.username)
    if found is None:
        security.burn_password_check(data.password)
        raise HTTPException(status_code=401, detail=LOGIN_FAILED)
    user, password_hash = found
    if not security.verify_password(data.password, password_hash):
        raise HTTPException(status_code=401, detail=LOGIN_FAILED)
    _start_session(response, user.id, session_token)
    return user


@app.post("/api/auth/logout", status_code=204)
def logout(session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None):
    if session_token:
        repository.delete_session(security.hash_session_token(session_token))
    response = Response(status_code=204)
    response.delete_cookie(SESSION_COOKIE, **COOKIE_OPTIONS)
    return response


@app.get("/api/auth/me", response_model=User)
def me(user: Annotated[User, Depends(current_user)]):
    return user


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
