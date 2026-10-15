#!/usr/bin/env bash
# Web 서버 구성: React 빌드 결과를 /var/www/lunch-slot에 복사하고 Nginx 설정을 등록·적용한다.
# - 빌드는 root가 아닌 사용자로 먼저 한다: (cd frontend && npm run build)
# - Nginx 설정 검사(nginx -t)에 실패하면 새 설정을 되돌리고 reload하지 않는다(다른 사이트 보호).
# 사용법(프로젝트 루트에서): sudo bash deploy/setup_web_server.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "오류: root 권한이 필요합니다. sudo bash deploy/setup_web_server.sh 로 실행하세요." >&2
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$SRC_DIR/frontend/dist"
WEB_ROOT=/var/www/lunch-slot
CONF_NAME=lunch-slot.conf
AVAILABLE="/etc/nginx/sites-available/$CONF_NAME"
ENABLED="/etc/nginx/sites-enabled/$CONF_NAME"

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "오류: $DIST_DIR/index.html 이 없습니다. 먼저 (cd frontend && npm run build) 를 실행하세요." >&2
  exit 1
fi

echo "[1/3] 정적 파일 복사 → $WEB_ROOT"
install -d -o root -g root -m 755 "$WEB_ROOT"
# 이전 빌드 파일만 지운다(이 사이트 전용 폴더).
find "$WEB_ROOT" -mindepth 1 -delete
cp -r "$DIST_DIR"/. "$WEB_ROOT"/
chown -R root:root "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 755 {} +
find "$WEB_ROOT" -type f -exec chmod 644 {} +

echo "[2/3] Nginx 설정 → $AVAILABLE"
backup=""
if [[ -f "$AVAILABLE" ]]; then
  backup="$(mktemp)"
  cp "$AVAILABLE" "$backup"
fi
install -o root -g root -m 644 "$SRC_DIR/deploy/nginx/$CONF_NAME" "$AVAILABLE"
ln -sfn "$AVAILABLE" "$ENABLED"

echo "[3/3] 설정 검사 후 적용"
if ! nginx -t; then
  echo "오류: nginx -t 실패. 새 설정을 되돌립니다." >&2
  if [[ -n "$backup" ]]; then
    cp "$backup" "$AVAILABLE"
  else
    rm -f "$ENABLED" "$AVAILABLE"
  fi
  exit 1
fi
[[ -n "$backup" ]] && rm -f "$backup"
systemctl reload nginx
echo "완료: http://127.0.0.1:8081 (API 확인: curl -s 127.0.0.1:8081/api/health)"
