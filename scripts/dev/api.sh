#!/bin/bash
# 테스트 계정으로 로컬 백엔드(bootRun, :8080) API 호출 — "본문 [HTTP코드]" 출력
# usage: scripts/dev/api.sh <kakaoApiId> <METHOD> <path> [json]
#   예) scripts/dev/api.sh 9900000000004 GET /api/groups/me
# 쿠키는 계정별로 임시 파일에 둔다(BASE 로 다른 서버 지정 가능, 예: BASE=https://dev.crewhub.store)
BASE=${BASE:-http://127.0.0.1:8080}
JAR=${TMPDIR:-/tmp}/club-schedule-jar-$1
[ -f "$JAR" ] || curl -s -c "$JAR" -H 'Content-Type: application/json' -d "{\"kakaoApiId\":$1}" "$BASE/api/login/test" >/dev/null
if [ -n "$4" ]; then curl -s -b "$JAR" -X "$2" -H 'Content-Type: application/json' -d "$4" -w ' [%{http_code}]\n' "$BASE$3"
else curl -s -b "$JAR" -X "$2" -w ' [%{http_code}]\n' "$BASE$3"; fi
