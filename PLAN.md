# 오늘 뭐 먹지? PLAN
## 작업 원칙
한 번에 아래 작업 하나만 구현한다. 실제 확인 전에는 완료로 표시하지 않는다.
상태는 [ ] 미완료, [x] 확인 완료로 관리하고 확인 결과를 각 항목 아래 기록한다.
기능 번호(F01~F12)는 PRD.md의 요구사항 번호다.
## 디렉터리 구조
```
lunch-slot/
├── frontend/          # React(Vite): src/App.jsx, src/api.js, src/components/
├── backend/           # FastAPI: main.py, schemas.py, repository.py, database.py, init_db.py
├── db/create_db.sh    # 프로젝트 루트 .env 값을 읽어 MariaDB 사용자·DB 생성 (비밀번호는 파일에 쓰지 않음)
├── deploy/nginx/      # Nginx 설정
└── API-SPEC.md
```
## 1장: 준비
- [x] T00: Node.js·npm, Python, MariaDB, Nginx 설치 확인. (현재 npm 미설치)
  확인: node -v, npm -v, python3 --version, mariadb --version, nginx -v 모두 버전 출력.
  결과(2026-10-14): node v22.22.1, npm 9.2.0(sudo apt install -y npm으로 설치), Python 3.14.4, MariaDB 11.8.6, nginx 1.28.3 출력 확인. 변경 파일: PLAN.md. 남은 오류 없음.
## 2장: 브라우저 앱
- [x] T01: frontend에 Vite React 프로젝트 생성. App.jsx에 식당 이름 입력·등록·목록만 구현한다. (F01, F02)
  확인: 두 곳 등록, 공백만 입력·51자 입력 거절, "  국밥  "은 "국밥"으로 표시. 새로고침하면 사라져도 정상이다.
  결과(2026-10-14): npm create vite@latest(Vite 8.3, React 19.2)로 생성. 변경 파일: frontend/ 전체(src/App.jsx, src/App.css, src/index.css, index.html 수정, 템플릿 데모 이미지 src/assets/ 삭제), PLAN.md. 실행: npm run lint·npm run build 통과, npm run dev -- --host 127.0.0.1 --port 5173. 브라우저에서 두 곳 최신순 등록, 공백만·51자 거절, "  국밥  " → "국밥", 새로고침 시 초기화를 사용자가 확인. 남은 오류 없음.
- [x] T02: localStorage(lunch-slot-v1) 저장·복원. frontend/src/storage.js 추가.
  확인: 새로고침 후 유지. 저장값을 `abc`로 바꾸고 새로고침하면 "저장된 데이터를 읽을 수 없습니다" 표시, 등록 차단, 저장값 그대로 유지. "초기화" 확인 후에만 빈 목록으로 덮어쓰고 등록 가능.
  결과(2026-10-14): 변경 파일: frontend/src/storage.js(신규), src/App.jsx, src/App.css, PLAN.md. 저장은 등록·초기화 시에만 수행해 손상 상태에서 자동 덮어쓰기를 막음. 실행: npm run lint·npm run build 통과, 가짜 localStorage로 storage.js 시험(없음→빈 목록, abc·null·{}·[1]·필드 누락→손상 판정 및 저장값 유지, 저장 실패 감지). 브라우저에서 새로고침 후 유지, abc 손상 안내·등록 차단·저장값 유지, 초기화 취소 시 유지, 확인 후 빈 목록·등록 가능을 사용자가 확인. 남은 오류 없음.
- [x] T03: 이름 수정, 삭제 확인. 모두 id 기준. (F04 이름, F05)
  확인: 같은 이름 두 곳 중 하나만 수정됨. 삭제 취소 시 유지. 빈 이름 수정 거절.
  결과(2026-10-14): 변경 파일: frontend/src/components/RestaurantItem.jsx(신규), src/App.jsx, src/App.css, PLAN.md. 수정·삭제 모두 id 기준, 저장 성공 시에만 화면 반영, 저장값 손상 시 차단. 실행: npm run lint·npm run build 통과. 브라우저에서 같은 이름 두 곳 중 하나만 수정(새로고침 후 유지), 삭제 취소 시 유지, 확인 시 해당 항목만 삭제, 공백·51자 수정 거절, 수정 취소 시 원래 이름 유지를 사용자가 확인. 남은 오류 없음.
- [x] T04: 등록 시 카테고리·가격대·위치·메모·방문 상태·평점 입력, 수정 시 위치·메모 추가, 이름 검색·필터. (F03, F04, F06, F07, F08)
  확인: 이름만 등록 시 기타/1~2만 원/가보고 싶음/평점 없음. 수정 화면에는 이름·위치·메모만 있음. 검색+필터 AND 적용. 필터 중 수정·삭제가 정확한 항목에 적용.
  결과(2026-10-14): 변경 파일: frontend/src/constants.js·validation.js·components/RegisterForm.jsx·components/FilterBar.jsx(신규), src/App.jsx·components/RestaurantItem.jsx·storage.js·App.css, PLAN.md. 이전 단계 저장 항목은 불러올 때 기본값으로 채우고, 잘못된 값(category=PIZZA, rating=6 등)은 손상으로 처리. 실행: npm run lint(경고 없음)·npm run build 통과, Node로 storage 기본값·손상 판정과 위치 100/101자·메모 500/501자 검사 확인. 브라우저에서 이름만 등록 시 기본값 표시, 전체 항목 등록·새로고침 유지, 수정 화면 이름·위치·메모만 표시, 검색+필터 AND, 필터 중 수정·삭제 정확한 항목 적용, 위치·메모 길이 초과 거절을 사용자가 확인. 남은 오류 없음.
## 3장: API
- [x] T05: API-SPEC.md 작성, FastAPI /api/health 구현.
  확인: curl localhost:8001/api/health 로 200과 status=ok.
  결과(2026-10-14): 변경 파일: API-SPEC.md, backend/main.py, backend/requirements.txt(fastapi 0.143.0, uvicorn[standard] 0.54.0), .gitignore(.venv/, __pycache__/) 신규, PLAN.md. 8000번은 다른 앱(Task Flow, /opt/task-flow)이 사용 중이라 사용자 결정으로 API 포트를 8001로 변경(T05 확인·T08 프록시·실행 기준 수정). API-SPEC에 exclude_days 미전달 시 제외 안 함, 최근 방문 제외의 오늘 기준은 브라우저가 보내는 today로 정함(사용자 결정). 실행: python3 -m venv .venv, .venv/bin/pip install -r backend/requirements.txt(Python 3.14 설치 문제 없음), .venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload. curl localhost:8001/api/health → 200, {"status":"ok"}, /openapi.json 제목이 "오늘 뭐 먹지? API"임을 확인. 남은 오류 없음.
- [x] T06: 메모리 기반 /api/restaurants GET과 POST. 서버에서도 이름·필드 검증.
  확인: /docs에서 등록 후 조회. 빈 이름, category=PIZZA, rating=6은 422.
  결과(2026-10-14): 변경 파일: backend/schemas.py·repository.py(신규), backend/main.py, PLAN.md. 이름·위치·메모는 공백 제거 후 길이 검사, 정의되지 않은 필드 거절, rating은 strict 정수 1~5. 실행: .venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload. curl로 "  국밥  " → 201·"국밥"·기본값, 전체 항목 201, 50/100/500자 경계 201, 빈 이름·공백 이름·51자·이름 누락·name=123·PIZZA·CHEAP·DONE·rating 6/0/"3"/2.5·위치 101자·메모 501자·visit_count 전달 모두 422, GET 최신 등록순 확인. 사용자가 /docs에서 등록·조회와 빈 이름·PIZZA·rating=6의 422를 확인. 남은 오류 없음.
- [x] T07: PATCH(name, location, memo만 허용)·DELETE와 검색·필터(q, category, price_range, visit_status) 구현.
  확인: 미전달 필드 유지, PATCH에 category 전달 시 422, 없는 ID 404, 삭제 204. 필터 결과가 AND 조건과 일치.
  결과(2026-10-14): 변경 파일: backend/schemas.py(RestaurantUpdate), repository.py, main.py, PLAN.md. 실행: 8001 서버(--reload)에 curl로 확인. PATCH: memo만 보내면 나머지 유지·공백 제거, 같은 이름 "국밥" 두 곳 중 id=1만 수정, {} → 200 변경 없음, category·rating·visit_count 전달 422, 공백 이름·name=null·위치 101자 422, 없는 id 404, id=abc 422. DELETE: 204, 같은 id 재삭제·없는 id 404. 필터: q(공백 제거·대소문자 무시 "pASTA"→Pasta), category, category+price_range, q+category+price_range+visit_status 모두 AND로 일치, 결과 없음 → [], category=PIZZA·visit_status=DONE 422. 참고: curl에 한글을 인코딩 없이 넣으면 잘못된 요청이 되므로 URL 인코딩해서 확인. 남은 오류 없음.
- [x] T08: 프런트엔드 저장 처리를 API 호출로 교체. vite.config.js에 /api → 8001 프록시. storage.js 삭제.
  확인: 화면과 curl 목록이 같음. API 중지 시 "서버에 연결할 수 없습니다" 표시. API 재시작 시 데이터가 사라지면 정상.
  결과(2026-10-14): 변경 파일: frontend/src/api.js(신규), vite.config.js, src/App.jsx, components/RegisterForm.jsx·RestaurantItem.jsx, App.css, src/storage.js 삭제, PLAN.md. 서버 필드(snake_case)↔화면 필드(camelCase) 변환은 api.js에서만 수행, 검색·필터는 서버 쿼리 사용, 요청 중 버튼 잠금. 실행: npm run lint(경고 없음)·npm run build 통과. curl로 5173 프록시 목록 = 8001 직접 목록, API 중지 시 프록시가 본문 없는 502 반환, 재시작 후 목록 [] 확인. 가짜 fetch로 api.js의 필드 변환·쿼리, 연결 실패·502·본문 없는 500 → "서버에 연결할 수 없습니다", 404·422 한국어 안내 확인. 사용자가 브라우저에서 화면·curl 목록 일치, API 중지 시 안내 표시, 재시작 후 데이터 초기화를 확인. 남은 오류 없음.
## 4장: DB
- [x] T09: 프로젝트 루트 .env(DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)와 .env.example(가짜 값) 준비. .gitignore에 .env 추가. db/create_db.sh가 .env를 읽어 MariaDB 전용 사용자·DB(lunch_slot) 생성. 비밀번호는 .env에만 둔다.
  확인: git status에 .env가 보이지 않음. grep -rn "DB_PASSWORD=" --exclude=.env . 결과에 .env.example의 가짜 값만 나옴. mariadb -u lunch_app -p lunch_slot -e "SELECT 1" 성공.
  결과(2026-10-14): 사용자 결정으로 .env 위치를 backend/.env → 프로젝트 루트 .env로 변경(디렉터리 구조·T09 문장 수정). 변경 파일: .env.example·db/create_db.sh(신규), .gitignore(.env 추가), PLAN.md. .env는 권한 600, 비밀번호는 사용자가 직접 입력. create_db.sh는 .env를 source하지 않고 읽으며, SQL을 표준 입력으로 전달하고 기존 DB·사용자를 지우지 않음. 실행: 복사본에 MARIADB_ADMIN=cat으로 시험(.env 없음·빈 비밀번호·잘못된 DB 이름 거절, 따옴표·역슬래시 이스케이프, CRLF 처리). 사용자가 bash db/create_db.sh 실행 후 mariadb -u lunch_app -p lunch_slot -e "SELECT 1" 성공 확인. 추가로 .env 값으로 127.0.0.1 TCP 접속 시 lunch_app@localhost·lunch_slot·utf8mb4, 권한은 lunch_slot.*만임을 확인. git status에 .env 없음. grep 결과는 .env.example의 가짜 값과 이 확인 문장(PLAN.md)뿐. 남은 오류 없음.
- [x] T10: backend/database.py, init_db.py 생성. restaurants 테이블에 PRD 데이터 항목 전체와 기본값 정의.
  확인: python -m backend.init_db 실행 후 DESCRIBE restaurants로 컬럼·기본값 확인.
  결과(2026-10-14): 변경 파일: backend/database.py·init_db.py(신규), backend/requirements.txt(PyMySQL 1.2.3: MariaDB 드라이버·파라미터 바인딩, python-dotenv 1.2.4: 루트 .env 읽기), PLAN.md. database.py는 루트 .env를 읽되 기존 환경변수 우선, 누락 시 변수 이름만 알림. init_db는 CREATE TABLE IF NOT EXISTS로 기존 테이블·데이터 유지. 실행: .venv/bin/python -m backend.init_db 1회차 "만들었습니다", 2회차 "이미 있습니다". DESCRIBE: id(PK, auto_increment), name varchar(50), category enum 기본 ETC, price_range enum 기본 MID, location varchar(100) 기본 '', memo varchar(500) 기본 '', visit_status enum 기본 WANT, rating tinyint NULL, visit_count 기본 0, last_visited_at date NULL, created_at 기본 current_timestamp(), utf8mb4_unicode_ci·InnoDB, CHECK(rating 1~5). 롤백 트랜잭션에서 이름만 INSERT 시 기본값 적용, rating=6·category=PIZZA 거절 확인(행 수 0 유지). 남은 오류 없음.
- [x] T11: API 메모리 저장을 DB로 교체. SQL은 파라미터 바인딩만 사용. 샘플 데이터는 다시 등록한다.
  확인: 등록한 행을 SQL로 조회. API 재시작 후 데이터 유지. 이름 `'); DROP TABLE restaurants;--`가 글자 그대로 저장됨.
  결과(2026-10-14): 변경 파일: backend/repository.py(메모리 → MariaDB, 함수 이름·동작 유지로 main.py와 API 계약 변경 없음), PLAN.md. 값은 모두 %s 바인딩, PATCH 컬럼은 name·location·memo 허용 목록만 SQL에 사용, 검색어의 %·_는 LIKE 이스케이프. 실행: 8001 API에 curl로 T06·T07 확인 재실행(등록 201·공백 제거, 빈 이름·PIZZA·rating=6 422, q·필터 AND, q=% / q=_ 는 글자 그대로 검색, PATCH 부분 수정·같은 값 재수정 200·{} 200·category 422·name=null 422·없는 id 404, DELETE 204·재삭제 404). database.py로 SQL 조회 시 등록·수정 행 확인. `'); DROP TABLE restaurants;--` 이름이 글자 그대로 저장되고 restaurants 테이블 유지. API 중지·재시작 후 4건 유지(5173 프록시 경유도 4건). 남은 오류 없음.
## 5장: 추천
- [x] T12: GET /api/recommendations/random 구현과 추천 화면. 조건(카테고리·가격대·방문 상태)에 맞는 후보 중 서버에서 무작위 1곳. (F09)
  확인: "일식" 조건 10회 추천 시 일식만 나옴. 후보 1곳이면 항상 그 식당. 후보 0곳이면 "조건에 맞는 식당이 없습니다".
  결과(2026-10-14): 변경 파일: backend/repository.py(조건 WHERE 공용화, random_restaurant: 후보 id 조회 후 random.choice), backend/main.py(추천 엔드포인트, 후보 0곳 404), frontend/src/api.js, components/Recommendation.jsx(신규), src/App.jsx, App.css, PLAN.md. 샘플로 스시·라멘(일식), 짜장면(중식) 등록. 실행: curl 20회씩 일식 → 라멘·스시만, 중식(후보 1곳) → 항상 짜장면, 카페(0곳) → 404 "조건에 맞는 식당이 없습니다", PIZZA·CHEAP·DONE 422. 저장소 함수 3,500회 호출 시 7곳 각 467~515회로 균등. npm run lint(경고 없음)·npm run build 통과. 사용자가 화면에서 일식 반복 추천·후보 1곳·후보 0곳 안내를 확인. 남은 오류 없음.
- [x] T13: 슬롯머신 애니메이션(약 1.5초)과 다시 뽑기. 결과는 서버 응답으로 고정. (F10)
  확인: 회전 후 결과 표시. 회전 중 연속 클릭해도 요청 1회.
  결과(2026-10-14): 변경 파일: frontend/src/components/Recommendation.jsx, App.css, PLAN.md. 회전 시작과 함께 요청 1회, 응답과 1.5초가 모두 지나야 결과 표시(회전 그림은 장식), 회전 중 버튼·조건 잠금과 ref로 연속 클릭 차단, 결과 후 "다시 뽑기", 동작 줄이기 설정 시 애니메이션 끔. 실행: npm run lint(경고 없음)·npm run build 통과. 사용자가 화면에서 회전 후 결과, 다시 뽑기, 연속 클릭 시 회전 1회, 후보 0곳 안내를 확인. API 접근 로그 기준 확인 기간의 추천 요청은 10건(일식 7, 중식 2, 카페 1)으로 연타가 요청으로 이어지지 않았음과 일치하나, 단계별 클릭 수를 따로 세지 않아 연타 단계만의 요청 수는 분리 확인하지 못함. 남은 오류 없음.
- [x] T14: POST /api/restaurants/{id}/visits(body: visited_on, 선택 rating)와 "여기로 결정" 버튼·평점 선택. 날짜는 브라우저 로컬 날짜. (F11)
  확인: 결정 시 가봤음·방문 1회·오늘 날짜 표시. 다시 결정하면 2회. 평점 4 선택 시 4로 저장, 평점 미선택 시 기존 평점 유지, rating=6은 422. API 재시작 후 유지.
  결과(2026-10-14): 변경 파일: backend/schemas.py(VisitCreate), repository.py(record_visit: UPDATE 1회, rating은 COALESCE로 미지정 시 유지), main.py, frontend/src/api.js, constants.js(localToday·visitSummary), components/Recommendation.jsx·RestaurantItem.jsx, App.jsx, App.css, PLAN.md. 처음 visited_on을 strict date로 두었더니 FastAPI가 본문을 Python 값으로 검증해 정상 문자열도 422가 됨 → YYYY-MM-DD 문자열 사전 검사 후 일반 변환으로 수정. 실행: 시험용 식당(평점 2)에 curl로 1회차 VISITED·1회·2026-10-14·평점 2 유지, 2회차 2회, rating 4 → 4, rating null → 4 유지, rating 6·"4", 2026/10/14·2026-13-01·2026-02-30·숫자·시각 포함·누락·추가 필드 422, 없는 id 404 확인 후 시험용 식당 삭제. npm run lint(경고 없음)·npm run build 통과. 사용자가 화면에서 결정 시 가봤음·방문 1회·오늘 날짜, 재결정 2회, 평점 4 저장·미선택 시 유지를 확인. API 중지·재시작 전후 목록(방문 기록 포함 7건) 동일. 남은 오류 없음.
- [x] T15: 최근 N일 방문 제외 옵션(exclude_days 1~30, 기본 3). (F12)
  확인: last_visited_at을 SQL로 오늘/3일 전/4일 전으로 바꾼 뒤 N=3이면 오늘·3일 전 식당은 안 나오고 4일 전 식당은 나올 수 있음. exclude_days=0, 31은 422.
  결과(2026-10-14): 변경 파일: backend/schemas.py(날짜 검사를 공용 IsoDate로 분리), repository.py(last_visited_at IS NULL OR < today-N 조건), main.py(exclude_days 1~30·today 쿼리, today 없으면 422), frontend/src/api.js, constants.js, components/Recommendation.jsx(제외 옵션·일수 입력, 범위 밖 값 요청 전 안내), App.css, PLAN.md. 실행: 시험용 카페 4곳을 만들고 SQL로 last_visited_at을 10-14(오늘)/10-11(3일 전)/10-10(4일 전)/NULL로 설정, 30회씩 추천: 제외 없음 4곳 모두, N=3 → 4일 전·미방문만, N=1 → 3일 전·4일 전·미방문, N=4·30 → 미방문만, VISITED+N=4 → 404. exclude_days=0·31·abc, today 누락, today=2026/10/14·2026-02-30·숫자 422. T14 방문 날짜 검사 회귀 확인. 가짜 fetch로 옵션 끔/켬 쿼리 확인. npm run lint(경고 없음)·npm run build 통과. 사용자가 화면에서 N=3 제외, 옵션 끔, 0·31 입력 안내를 확인. 확인 후 시험용 카페 4곳 삭제(전체 7건 유지). 남은 오류 없음.
- [x] T16: 입력 안전성·접속 정보 점검. dangerouslySetInnerHTML 사용 금지.
  확인: 이름·메모의 `<img src=x onerror=alert(1)>`가 글자로 표시. npm run build 후 grep -rn "DB_PASSWORD\|lunch_slot" frontend/dist frontend/src 결과 없음.
  결과(2026-10-14): 점검만 수행, 코드 변경 없음(변경 파일: PLAN.md). frontend/src에 dangerouslySetInnerHTML·innerHTML·outerHTML·insertAdjacentHTML·document.write·eval·new Function 없음, import.meta.env·process.env 사용 없음, frontend/.env* 없음. npm run build 후 grep -rn "DB_PASSWORD\|lunch_slot" frontend/dist frontend/src 결과 없음(종료 코드 1). 추가로 DB_HOST·DB_USER·lunch_app·3306·mariadb·pymysql 없음, .env의 실제 비밀번호·사용자·DB 이름 값이 dist·src 16개 파일에 없음(값은 출력하지 않음). 이름·위치·메모에 HTML·스크립트 문자열을 넣은 시험용 식당을 API로 등록해 그대로 저장됨을 확인. 사용자가 화면에서 목록·수정 폼·추천 결과·직접 등록 시 모두 글자로 표시되고 알림 창이 뜨지 않음을 확인. 확인 후 시험용 식당 삭제(전체 7건). 남은 오류 없음.
## 6장: 서버 분리
- [x] T17: DB 서버 구성 후 App 서버에서 SELECT 1 확인. (한 대에서는 DB_HOST만 설정값으로 분리)
  결과(2026-10-14): 별도 서버 접속 정보가 없어 사용자 결정으로 서버 한 대(이 머신)에서 진행. 변경 파일: .env.example(서버 분리 시 DB_HOST·계정 설정 주석), PLAN.md. backend 코드에 DB 주소·포트·이름 고정값 없음(grep), 접속값은 .env 또는 환경변수에서만 읽음. 실행: backend.database.get_connection으로 SELECT 1 → 성공(lunch_app@localhost, lunch_slot). DB_HOST만 환경변수로 바꿔 실행 시 localhost 성공, 127.0.0.2·db.invalid는 접속 실패로 DB_HOST 값대로 대상이 바뀜을 확인. API GET /api/restaurants 200. 실제 DB 서버 분리(bind-address·App 서버 IP 계정)는 서버 준비 후 진행 필요. 남은 오류 없음.
- [ ] T18: App 서버 코드·가상환경·환경변수·systemd 구성. --reload 없이 실행.
  확인: App에서 /api/health 응답.
- [ ] T19: Web 서버 Nginx와 정적 파일(frontend/dist)·/api 프록시 구성. deploy/nginx/lunch-slot.conf 작성.
  확인: Web 주소로 등록·추천, DB 저장, App 재시작 후 유지.
- [ ] T20: PRD 완료 기준 전체 점검.
  확인: 등록·빈 이름 거절·수정·삭제 취소·필터 중 수정·추천 조건·최근 방문 제외·재시작 후 유지·DB 정보 비노출·HTML 비실행.
## 실행 기준
T01~T04: cd frontend && npm install && npm run dev -- --host 127.0.0.1 --port 5173
T05~T16: 가상환경에서 python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload (T08부터 프론트도 함께 실행)
DB 확인: mariadb -u lunch_app -p lunch_slot
실제 존재하는 파일을 확인한 뒤 명령을 실행한다.
## 기록
각 작업에 변경 파일, 실행 명령, 실제 확인 결과, 남은 오류를 기록한다.
정상 동작을 확인한 작업 단위로 Git 커밋한다.
