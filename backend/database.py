import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from pymysql.cursors import DictCursor

# 프로젝트 루트의 .env를 읽는다. 이미 설정된 환경변수(예: systemd)가 있으면 그 값을 우선한다.
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_FILE, override=False)

REQUIRED_KEYS = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")


def _settings() -> dict:
    missing = [key for key in REQUIRED_KEYS if not os.environ.get(key)]
    if missing:
        # 값은 출력하지 않고 빠진 변수 이름만 알린다.
        raise RuntimeError(f"DB 접속 환경변수가 없습니다: {', '.join(missing)} ({ENV_FILE} 확인)")
    return {
        "host": os.environ["DB_HOST"],
        "port": int(os.environ["DB_PORT"]),
        "database": os.environ["DB_NAME"],
        "user": os.environ["DB_USER"],
        "password": os.environ["DB_PASSWORD"],
    }


def get_connection() -> pymysql.connections.Connection:
    """새 DB 연결을 연다. 행은 dict로 받는다. 사용 후 close해야 한다."""
    return pymysql.connect(
        **_settings(),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
    )
