# 개발 서버에서 개발하기

개발은 Ubuntu 서버(dev.crewhub.store)에서 직접 한다. 소스는 `~/workspace/club-schedule`, DB는 같은 서버의 `mariadb-dev`(`app_dev`).

## 전체 구조

```
~/workspace/club-schedule/            git 저장소 (모노레포)
├── backend/                          Spring Boot (gradlew, Dockerfile)
├── frontend/                         Vite + React + TS (npm, Dockerfile, nginx.conf)
├── deploy/compose.yml                배포 정의 (dev/prod 공통)
└── scripts/bootrun-dev.sh            호스트에서 백엔드 직접 실행

~/services/club-schedule/             서버 전용 (git 제외)
├── compose.yml                       CI 가 deploy/compose.yml 을 복사
└── dev.env                           실제 환경변수 (권한 600)
```

```
브라우저 ─► NPM(443) ─┬─ 기본(모든 화면, React)  → club-schedule-web-dev:80        (배포본, CI)
                      └─ /api/ (deploy/api-routes) → club-schedule-api-dev:8081 ─► mariadb-dev:3306
개발자   ─► 127.0.0.1:5173 (vite) ─ /api ─► 127.0.0.1:8081 (bootRun) ─► 127.0.0.1:3307   (작업본)
```

- 배포본 컨테이너는 호스트 포트를 열지 않는다. 호스트 8081 은 bootRun 전용이다.
- `mariadb-dev` 는 호스트 `127.0.0.1:3307` 로 publish 되어 있다(3306 은 `mariadb-prod` — 혼동 주의).

## 도구

`mise` 로 사용자 계정에 설치되어 있다: JDK 17(temurin), Node LTS, gh. 새 셸에서 `java -version` 이 안 되면 `eval "$(~/.local/bin/mise activate bash)"`.

## 백엔드 실행

```bash
scripts/bootrun-dev.sh
```

- `~/services/club-schedule/dev.env` 를 읽어 환경변수로 넘기고, DB 주소만 `mariadb-dev:3306` → `127.0.0.1:3307` 로 바꿔 `./gradlew bootRun` 을 실행한다.
- `Started MoyoraClubScheduleApplication` 이 뜨면 정상. 브라우저에서 보려면 SSH 터널: `ssh -L 8081:127.0.0.1:8081 ubuntu@<서버>` → `http://localhost:8081`
- ⚠️ 템플릿/정적 리소스(`backend/src/main/resources/templates`, `static`)를 고친 뒤에는 bootRun 을 재시작해야 반영된다(기동 시점 스냅샷을 서빙).

## 프론트엔드 실행

```bash
scripts/bootrun-dev.sh &          # 백엔드 (127.0.0.1:8081)
cd frontend && npm run dev        # http://127.0.0.1:5173, /api 는 8081 로 프록시
```

- 브라우저에서 보려면 SSH 터널: `ssh -L 5173:127.0.0.1:5173 ubuntu@<서버>` → `http://localhost:5173`
- 같은 출처로 프록시하므로 `AUTH_TOKEN` 쿠키 인증이 그대로 동작한다. 로그인은 `POST /api/login/test`.
- 규약: CLAUDE.md "프론트엔드" 절.

## 빌드·테스트

```bash
cd backend
./gradlew bootJar           # 실행 jar
./gradlew test              # contextLoads 는 DB/환경변수 없이는 실패 (단위 테스트만 의미 있음)
docker build -t club-schedule:local .

cd frontend
npm run typecheck && npm test && npm run build
docker build -t club-schedule-web:local .
```

## 배포

`master` push → GitHub Actions(`.github/workflows/deploy.yml`):
1. `backend/`, `frontend/` 를 linux/arm64 이미지로 빌드해 Docker Hub 에 push (`club-schedule`, `club-schedule-web` × `latest`, 커밋 SHA)
2. `deploy/compose.yml` 을 서버 `~/services/club-schedule/` 로 복사
3. `APP_ENV=dev docker compose up -d` → 컨테이너 `club-schedule-api-dev`, `club-schedule-web-dev`
4. NPM: `deploy/api-routes` 의 경로를 api 컨테이너로(custom location), 나머지(기본)는 web 컨테이너로 (`npm-site locations` → `npm-site forward`)

### 화면을 React 로 옮길 때

1. `frontend/src/routes/` 에 같은 URL 의 라우트를 만든다(기존 링크·카카오 redirect URI 를 그대로 쓰기 위해).
2. 아직 Thymeleaf 인 화면으로 이동할 때는 `navigateToServerPage()`(전체 페이지 이동)를 쓴다.
3. `deploy/api-routes` 에서 그 화면의 Thymeleaf 경로를 지운다 → master 배포 시 NPM 이 그 경로를 web 으로 보낸다.
4. 롤백(전부 Thymeleaf 로): 서버에서 `npm-site forward dev.crewhub.store club-schedule-api-dev 8081 && npm-site locations dev.crewhub.store x 0`
   (특정 경로만 되돌리려면 api-routes 에 다시 넣고 재배포)

수동 재배포/롤백:

```bash
cd ~/services/club-schedule
APP_ENV=dev IMAGE_TAG=<커밋 SHA 또는 latest> docker compose up -d
```

## 테스트 로그인

`/login/test` 에서 계정 선택 → 내부적으로 `POST /api/login/test` (`{"kakaoApiId": ...}`). 계정 범위·역할은 `CLAUDE.md` 참고.

## 트러블슈팅

| 증상 | 원인 | 조치 |
|------|------|------|
| `Error creating bean ... DataSource` | DB 연결 실패 | `docker ps` 로 `mariadb-dev` 확인, `dev.env` 의 DB 계정 확인 |
| DB는 붙는데 데이터가 이상함 | 3306(=`mariadb-prod`)에 접속 | bootRun 은 3307, 컨테이너는 `mariadb-dev:3306` |
| 포트 8081 already in use | 이전 bootRun 프로세스가 남아 있음 | `ss -ltnp \| grep 8081` 로 찾아 종료 |
| dev.crewhub.store 502 | 컨테이너 미기동 또는 NPM 전달 대상 불일치 | `docker logs club-schedule-api-dev`, `npm-site list` |
| 화면(html/js) 수정이 반영 안 됨 | bootRun 이 기동 시점 리소스를 서빙 중 | bootRun 재시작 |

## 관련 문서

- `CLAUDE.md` — 프로젝트 규칙, 테스트 계정
- `docs/DATABASE.md` — 스키마 및 마이그레이션 이력
- 서버 공용 인프라(NPM, MariaDB, 도메인 추가): 서버 `~/infra/README.md`
