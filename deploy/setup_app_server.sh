#!/usr/bin/env bash
# App 서버 구성: 코드 복사, 가상환경, 접속 정보, systemd 서비스 등록·시작.
# - 코드·가상환경은 /opt/lunch-slot(root 소유), 서비스는 전용 사용자 lunchslot으로 실행한다.
# - /opt/lunch-slot/.env가 없을 때만 프로젝트 .env를 복사한다(기존 값은 덮어쓰지 않음, 내용은 출력하지 않음).
# - 다시 실행하면 코드와 의존성을 갱신하고 서비스를 재시작한다.
# 사용법(프로젝트 루트에서): sudo bash deploy/setup_app_server.sh
# 같은 서버에서 Nginx가 8080을 쓰고 있었다면 setup_web_server.sh(8081)를 먼저 실행해 8080을 비운다.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "오류: root 권한이 필요합니다. sudo bash deploy/setup_app_server.sh 로 실행하세요." >&2
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR=/opt/lunch-slot
APP_USER=lunchslot
SERVICE=lunch-slot-api

if [[ ! -f "$SRC_DIR/.env" && ! -f "$APP_DIR/.env" ]]; then
  echo "오류: $SRC_DIR/.env 가 없습니다. .env.example을 복사해 값을 채우세요." >&2
  exit 1
fi

echo "[1/5] 서비스 사용자 $APP_USER"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
fi

echo "[2/5] 코드 복사 → $APP_DIR/backend"
install -d -o root -g root -m 755 "$APP_DIR" "$APP_DIR/backend"
install -o root -g root -m 644 "$SRC_DIR"/backend/*.py "$SRC_DIR/backend/requirements.txt" "$APP_DIR/backend/"

echo "[3/5] 가상환경과 의존성 → $APP_DIR/.venv"
if [[ ! -x "$APP_DIR/.venv/bin/python" ]]; then
  python3 -m venv "$APP_DIR/.venv"
fi
"$APP_DIR/.venv/bin/pip" install --quiet --disable-pip-version-check -r "$APP_DIR/backend/requirements.txt"

echo "[4/5] 접속 정보 → $APP_DIR/.env (root:$APP_USER, 640)"
if [[ -f "$APP_DIR/.env" ]]; then
  echo "      이미 있어 그대로 둡니다. 값을 바꾸려면 직접 수정한 뒤 systemctl restart $SERVICE"
else
  install -o root -g "$APP_USER" -m 640 "$SRC_DIR/.env" "$APP_DIR/.env"
fi

echo "[5/5] systemd 서비스 $SERVICE 등록·시작"
install -o root -g root -m 644 "$SRC_DIR/deploy/systemd/$SERVICE.service" "/etc/systemd/system/$SERVICE.service"
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null
systemctl restart "$SERVICE"
sleep 2
systemctl --no-pager --lines=0 status "$SERVICE" || true
echo "확인: curl -s 127.0.0.1:8080/api/health"
