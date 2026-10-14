from datetime import date, datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class Category(str, Enum):
    KOREAN = "KOREAN"
    CHINESE = "CHINESE"
    JAPANESE = "JAPANESE"
    WESTERN = "WESTERN"
    SNACK = "SNACK"
    CAFE = "CAFE"
    ETC = "ETC"


class PriceRange(str, Enum):
    LOW = "LOW"
    MID = "MID"
    HIGH = "HIGH"


class VisitStatus(str, Enum):
    WANT = "WANT"
    VISITED = "VISITED"


# 문자열은 앞뒤 공백을 제거한 뒤 길이를 검사한다. 파이썬 len은 코드 포인트 기준이다.
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Location = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
Memo = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]
# "3", 3.0, true 같은 값이 정수로 바뀌지 않도록 strict로 받는다.
Rating = Annotated[int, Field(ge=1, le=5, strict=True)]


class RestaurantCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Name
    category: Category = Category.ETC
    price_range: PriceRange = PriceRange.MID
    location: Location = ""
    memo: Memo = ""
    visit_status: VisitStatus = VisitStatus.WANT
    rating: Rating | None = None


class RestaurantUpdate(BaseModel):
    """이름·위치·메모만 부분 수정한다. 다른 필드를 보내면 422.

    기본값 None은 "보내지 않음"을 뜻하며 검증하지 않는다. null을 직접 보내면
    문자열이 아니므로 422가 된다. 실제 변경 값은 model_dump(exclude_unset=True)로 꺼낸다.
    """

    model_config = ConfigDict(extra="forbid")

    name: Name = None
    location: Location = None
    memo: Memo = None


class Restaurant(BaseModel):
    id: int
    name: str
    category: Category
    price_range: PriceRange
    location: str
    memo: str
    visit_status: VisitStatus
    rating: int | None
    visit_count: int
    last_visited_at: date | None
    created_at: datetime
