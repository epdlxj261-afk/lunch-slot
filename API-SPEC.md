# 오늘 뭐 먹지? API 명세

PRD.md의 요구사항(F01~F12)을 백엔드 API로 옮긴 계약이다. 구현 순서는 PLAN.md(T05~T15)를 따른다.

## 공통
- 기본 주소: `/api`. 프런트엔드는 이 경로로만 데이터를 요청한다.
- 요청·응답 본문은 JSON(UTF-8)이다.
- 식당은 화면 순번이 아닌 고유 `id`(정수)로 다룬다.
- 날짜는 `YYYY-MM-DD`, 일시는 ISO 8601 문자열이다.
- 문자열 입력은 앞뒤 공백을 제거한 뒤 검증·저장한다. 글자 수는 문자(코드 포인트) 기준이다.
- 정의되지 않은 필드를 보내면 422로 거절한다.

## 코드값
| 필드 | 값 | 기본값 |
|---|---|---|
| category | KOREAN(한식), CHINESE(중식), JAPANESE(일식), WESTERN(양식), SNACK(분식), CAFE(카페), ETC(기타) | ETC |
| price_range | LOW(~1만 원), MID(1~2만 원), HIGH(2만 원~) | MID |
| visit_status | WANT(가보고 싶음), VISITED(가봤음) | WANT |

## Restaurant 객체
| 필드 | 타입 | 설명 |
|---|---|---|
| id | integer | 고유 번호 |
| name | string | 1~50자 |
| category | string | 코드값 |
| price_range | string | 코드값 |
| location | string | 0~100자, 기본 `""` |
| memo | string | 0~500자, 기본 `""` |
| visit_status | string | 코드값 |
| rating | integer \| null | 1~5, 미지정 `null` |
| visit_count | integer | 방문 횟수, 기본 0 |
| last_visited_at | string(date) \| null | 마지막 방문일, 미방문 `null` |
| created_at | string(datetime) | 등록 일시 |

예시
```json
{
  "id": 1,
  "name": "국밥집",
  "category": "KOREAN",
  "price_range": "LOW",
  "location": "회사 1층",
  "memo": "",
  "visit_status": "WANT",
  "rating": null,
  "visit_count": 0,
  "last_visited_at": null,
  "created_at": "2026-10-14T12:00:00"
}
```

## 오류 응답
| 상태 | 경우 | 본문 |
|---|---|---|
| 404 | 없는 id, 추천 후보 0개 | `{"detail": "<안내 문구>"}` |
| 422 | 입력 검증 실패 | FastAPI 기본 형식 `{"detail": [ ... ]}` |

## 엔드포인트

### GET /api/health  (T05)
서버 상태 확인.
- 200: `{"status": "ok"}`

### GET /api/restaurants  (T06, 필터는 T07)
식당 목록. 최신 등록순(created_at 내림차순, 같으면 id 내림차순).

쿼리(모두 선택, 함께 쓰면 AND)
| 이름 | 설명 |
|---|---|
| q | 이름에 포함된 글자(대소문자 구분 없음). 공백 제거 후 빈 값이면 조건 없음 |
| category | 코드값 |
| price_range | 코드값 |
| visit_status | 코드값 |

- 200: `Restaurant[]`
- 422: 코드값이 아닌 필터 값

### POST /api/restaurants  (T06)
식당 등록.

본문
| 필드 | 필수 | 규칙 |
|---|---|---|
| name | O | 공백 제거 후 1~50자 |
| category | | 코드값, 기본 ETC |
| price_range | | 코드값, 기본 MID |
| location | | 공백 제거 후 0~100자, 기본 `""` |
| memo | | 공백 제거 후 0~500자, 기본 `""` |
| visit_status | | 코드값, 기본 WANT |
| rating | | 1~5 정수 또는 null, 기본 null |

`visit_count`, `last_visited_at`, `id`, `created_at`은 받지 않는다(422).

- 201: 등록된 `Restaurant`
- 422: 빈 이름, 51자 이름, `category=PIZZA`, `rating=6` 등

### PATCH /api/restaurants/{id}  (T07)
이름·위치·메모만 부분 수정한다. 보내지 않은 필드는 유지한다.

본문
| 필드 | 규칙 |
|---|---|
| name | 공백 제거 후 1~50자. null 불가 |
| location | 공백 제거 후 0~100자. null 불가 |
| memo | 공백 제거 후 0~500자. null 불가 |

- 200: 수정된 `Restaurant`
- 404: `{"detail": "식당을 찾을 수 없습니다"}`
- 422: 규칙 위반, 또는 `category` 등 수정 대상이 아닌 필드 전달

### DELETE /api/restaurants/{id}  (T07)
- 204: 본문 없음
- 404: `{"detail": "식당을 찾을 수 없습니다"}`

### GET /api/recommendations/random  (T12, 최근 방문 제외는 T15)
조건에 맞는 후보 중 1곳을 서버에서 균등 무작위로 고른다.

쿼리(모두 선택, 함께 쓰면 AND)
| 이름 | 설명 |
|---|---|
| category | 코드값 |
| price_range | 코드값 |
| visit_status | 코드값 |
| exclude_days | 1~30 정수. 보내지 않으면 최근 방문 제외를 하지 않는다. 화면에서 옵션을 켜면 기본값 3을 채워 보낸다 |
| today | 브라우저 로컬 날짜 `YYYY-MM-DD`. `exclude_days`를 보낼 때 필수 |

최근 방문 제외: `last_visited_at`이 `today - exclude_days` 이후(그날 포함)인 식당을 후보에서 뺀다. 오늘을 0일 전으로 보며, N=3이면 0~3일 전 방문은 제외되고 4일 전 방문부터 후보가 된다. 미방문(`null`)은 항상 후보다.
날짜 기준을 브라우저가 보낸 `today`로 두어 서버 시간대와 관계없이 사용자의 로컬 달력 날짜로 계산한다.

- 200: 선택된 `Restaurant`
- 404: `{"detail": "조건에 맞는 식당이 없습니다"}`
- 422: 코드값이 아닌 조건, `exclude_days`가 0·31 등 범위 밖, `exclude_days`만 있고 `today` 없음, 날짜 형식 오류

### POST /api/restaurants/{id}/visits  (T14)
추천 결과에서 "여기로 결정"을 눌렀을 때 방문을 기록한다.

본문
| 필드 | 필수 | 규칙 |
|---|---|---|
| visited_on | O | 브라우저 로컬 날짜 `YYYY-MM-DD` |
| rating | | 1~5 정수. 보내지 않거나 null이면 기존 평점 유지 |

처리: `visit_status`를 VISITED로, `visit_count`를 1 증가, `last_visited_at`을 `visited_on`으로 바꾸고, `rating`이 있으면 그 값으로 바꾼다.

- 200: 갱신된 `Restaurant`
- 404: `{"detail": "식당을 찾을 수 없습니다"}`
- 422: `rating=6`, 날짜 형식 오류 등
