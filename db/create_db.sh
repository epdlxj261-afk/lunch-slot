#!/usr/bin/env bash
# 프로젝트 루트의 .env 값을 읽어 MariaDB 전용 사용자와 DB를 만든다.
# - 비밀번호는 .env에서만 읽고, 이 파일·명령줄·로그에 남기지 않는다(SQL은 표준 입력으로 전달).
# - 이미 있는 DB와 사용자는 지우지 않는다. 사용자가 있으면 비밀번호만 .env 값으로 맞춘다.
# - MariaDB 관리자 권한이 필요하다. 기본은 sudo mariadb (환경변수 MARIADB_ADMIN으로 바꿀 수 있음).
# 사용법: bash db/create_db.sh
set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "오류: $ENV_FILE 이 없습니다. .env.example을 복사해 값을 채우세요." >&2
  exit 1
fi

# .env를 실행(source)하지 않고 KEY=VALUE 줄만 읽는다.
declare -A cfg=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  # 값 양끝의 따옴표 한 쌍은 벗긴다.
  if [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]]; then
    value="${BASH_REMATCH[1]}"
  fi
  case "$key" in
    DB_NAME | DB_USER | DB_PASSWORD) cfg[$key]="$value" ;;
  esac
done < "$ENV_FILE"

for key in DB_NAME DB_USER DB_PASSWORD; do
  if [[ -z "${cfg[$key]:-}" ]]; then
    echo "오류: .env에 $key 값이 비어 있습니다." >&2
    exit 1
  fi
done

# DB 이름과 사용자 이름은 SQL 식별자로 쓰므로 영문·숫자·밑줄만 허용한다.
for key in DB_NAME DB_USER; do
  if [[ ! "${cfg[$key]}" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "오류: $key 는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다." >&2
    exit 1
  fi
done

# 비밀번호는 SQL 문자열 안에 들어가므로 역슬래시와 작은따옴표를 이스케이프한다.
password="${cfg[DB_PASSWORD]}"
password="${password//\\/\\\\}"
password="${password//\'/\\\'}"

db_name="${cfg[DB_NAME]}"
db_user="${cfg[DB_USER]}"
read -r -a admin_cmd <<< "${MARIADB_ADMIN:-sudo mariadb}"

echo "DB '$db_name', 사용자 '$db_user'@'localhost' 를 준비합니다. (관리자 명령: ${admin_cmd[*]})"
"${admin_cmd[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$db_user'@'localhost' IDENTIFIED BY '$password';
ALTER USER '$db_user'@'localhost' IDENTIFIED BY '$password';
GRANT ALL PRIVILEGES ON \`$db_name\`.* TO '$db_user'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "완료: mariadb -u $db_user -p $db_name -e \"SELECT 1\" 로 접속을 확인하세요."
