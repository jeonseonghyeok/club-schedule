#!/usr/bin/env bash
# 개발 서버(호스트)에서 백엔드를 직접 띄운다: app_dev(mariadb-dev, 127.0.0.1:3307) 에 접속.
#   scripts/bootrun-dev.sh            # http://127.0.0.1:8081
# 환경변수는 ~/services/club-schedule/dev.env 를 읽고, DB 호스트만 컨테이너명 → 호스트 포트로 바꾼다.
set -euo pipefail

ENV_FILE=${ENV_FILE:-$HOME/services/club-schedule/dev.env}
[[ -r $ENV_FILE ]] || { echo "error: $ENV_FILE 이 없습니다 (deploy/.env.example 참고)" >&2; exit 1; }

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a
DATASOURCE_URL=${DATASOURCE_URL/\/\/mariadb-dev:3306/\/\/127.0.0.1:3307}
export DATASOURCE_URL

cd "$(dirname "$0")/../backend"
exec ./gradlew bootRun "$@"
