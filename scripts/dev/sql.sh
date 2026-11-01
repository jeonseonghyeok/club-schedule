#!/bin/bash
# dev DB(app_dev)에 SQL 실행 — usage: scripts/dev/sql.sh "<SQL>"  (또는 표준입력)
# 접속 정보는 서버 ~/services/club-schedule/dev.env, DB 는 mariadb-dev 컨테이너
set -a; . ~/services/club-schedule/dev.env; set +a
if [ $# -gt 0 ]; then echo "$1"; else cat; fi |
  docker exec -i -e MYSQL_PWD="$DATASOURCE_PASSWORD" mariadb-dev mariadb -u"$DATASOURCE_USERNAME" app_dev "${SQL_OPTS:--t}"
