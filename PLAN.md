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
├── db/create_db.sh    # backend/.env 값을 읽어 MariaDB 사용자·DB 생성 (비밀번호는 파일에 쓰지 않음)
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
- [ ] T05: API-SPEC.md 작성, FastAPI /api/health 구현.
  확인: curl localhost:8000/api/health 로 200과 status=ok.
- [ ] T06: 메모리 기반 /api/restaurants GET과 POST. 서버에서도 이름·필드 검증.
  확인: /docs에서 등록 후 조회. 빈 이름, category=PIZZA, rating=6은 422.
- [ ] T07: PATCH(name, location, memo만 허용)·DELETE와 검색·필터(q, category, price_range, visit_status) 구현.
  확인: 미전달 필드 유지, PATCH에 category 전달 시 422, 없는 ID 404, 삭제 204. 필터 결과가 AND 조건과 일치.
- [ ] T08: 프런트엔드 저장 처리를 API 호출로 교체. vite.config.js에 /api → 8000 프록시. storage.js 삭제.
  확인: 화면과 curl 목록이 같음. API 중지 시 "서버에 연결할 수 없습니다" 표시. API 재시작 시 데이터가 사라지면 정상.
## 4장: DB
- [ ] T09: backend/.env(DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)와 .env.example(가짜 값) 준비. .gitignore에 .env 추가. db/create_db.sh가 .env를 읽어 MariaDB 전용 사용자·DB(lunch_slot) 생성. 비밀번호는 .env에만 둔다.
  확인: git status에 .env가 보이지 않음. grep -rn "DB_PASSWORD=" --exclude=.env . 결과에 .env.example의 가짜 값만 나옴. mariadb -u lunch_app -p lunch_slot -e "SELECT 1" 성공.
- [ ] T10: backend/database.py, init_db.py 생성. restaurants 테이블에 PRD 데이터 항목 전체와 기본값 정의.
  확인: python -m backend.init_db 실행 후 DESCRIBE restaurants로 컬럼·기본값 확인.
- [ ] T11: API 메모리 저장을 DB로 교체. SQL은 파라미터 바인딩만 사용. 샘플 데이터는 다시 등록한다.
  확인: 등록한 행을 SQL로 조회. API 재시작 후 데이터 유지. 이름 `'); DROP TABLE restaurants;--`가 글자 그대로 저장됨.
## 5장: 추천
- [ ] T12: GET /api/recommendations/random 구현과 추천 화면. 조건(카테고리·가격대·방문 상태)에 맞는 후보 중 서버에서 무작위 1곳. (F09)
  확인: "일식" 조건 10회 추천 시 일식만 나옴. 후보 1곳이면 항상 그 식당. 후보 0곳이면 "조건에 맞는 식당이 없습니다".
- [ ] T13: 슬롯머신 애니메이션(약 1.5초)과 다시 뽑기. 결과는 서버 응답으로 고정. (F10)
  확인: 회전 후 결과 표시. 회전 중 연속 클릭해도 요청 1회.
- [ ] T14: POST /api/restaurants/{id}/visits(body: visited_on, 선택 rating)와 "여기로 결정" 버튼·평점 선택. 날짜는 브라우저 로컬 날짜. (F11)
  확인: 결정 시 가봤음·방문 1회·오늘 날짜 표시. 다시 결정하면 2회. 평점 4 선택 시 4로 저장, 평점 미선택 시 기존 평점 유지, rating=6은 422. API 재시작 후 유지.
- [ ] T15: 최근 N일 방문 제외 옵션(exclude_days 1~30, 기본 3). (F12)
  확인: last_visited_at을 SQL로 오늘/3일 전/4일 전으로 바꾼 뒤 N=3이면 오늘·3일 전 식당은 안 나오고 4일 전 식당은 나올 수 있음. exclude_days=0, 31은 422.
- [ ] T16: 입력 안전성·접속 정보 점검. dangerouslySetInnerHTML 사용 금지.
  확인: 이름·메모의 `<img src=x onerror=alert(1)>`가 글자로 표시. npm run build 후 grep -rn "DB_PASSWORD\|lunch_slot" frontend/dist frontend/src 결과 없음.
## 6장: 서버 분리
- [ ] T17: DB 서버 구성 후 App 서버에서 SELECT 1 확인. (한 대에서는 DB_HOST만 설정값으로 분리)
- [ ] T18: App 서버 코드·가상환경·환경변수·systemd 구성. --reload 없이 실행.
  확인: App에서 /api/health 응답.
- [ ] T19: Web 서버 Nginx와 정적 파일(frontend/dist)·/api 프록시 구성. deploy/nginx/lunch-slot.conf 작성.
  확인: Web 주소로 등록·추천, DB 저장, App 재시작 후 유지.
- [ ] T20: PRD 완료 기준 전체 점검.
  확인: 등록·빈 이름 거절·수정·삭제 취소·필터 중 수정·추천 조건·최근 방문 제외·재시작 후 유지·DB 정보 비노출·HTML 비실행.
## 실행 기준
T01~T04: cd frontend && npm install && npm run dev -- --host 127.0.0.1 --port 5173
T05~T16: 가상환경에서 python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload (T08부터 프론트도 함께 실행)
DB 확인: mariadb -u lunch_app -p lunch_slot
실제 존재하는 파일을 확인한 뒤 명령을 실행한다.
## 기록
각 작업에 변경 파일, 실행 명령, 실제 확인 결과, 남은 오류를 기록한다.
정상 동작을 확인한 작업 단위로 Git 커밋한다.
