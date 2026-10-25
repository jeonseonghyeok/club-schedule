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
- `Started MoyoraClubScheduleApplication` 이 뜨면 정상. 백엔드는 `/api/**` 만 응답한다 — 화면은 아래 프론트엔드 개발 서버로 본다.

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

### 라우팅 메모

- 화면 경로는 모두 web(SPA)이 응답하고, `deploy/api-routes` 의 `/api/` 만 api 로 간다.
- 새 화면은 `frontend/src/routes/` 에 라우트만 추가하면 된다(NPM 설정 변경 불필요).
- 백엔드에 화면이 아닌 새 경로(예: 웹훅)를 열 때만 `deploy/api-routes` 에 추가한다.

수동 재배포/롤백:

```bash
cd ~/services/club-schedule
APP_ENV=dev IMAGE_TAG=<커밋 SHA 또는 latest> docker compose up -d
```

- api·web 이미지는 같은 커밋 SHA 로 태그되므로, **화면 분리 이후(web 이미지가 있는) 커밋**이면 위 한 줄로 둘 다 되돌아간다.
- **화면 분리 이전 커밋(Thymeleaf 가 화면을 그리던 버전)으로 되돌릴 때**는 web 이미지가 없고 NPM 이 화면 경로를 web 으로 보내므로,
  NPM 도 함께 되돌려야 한다:

```bash
# 모든 경로를 api(Thymeleaf 포함 버전)로, custom location 해제
npm-site forward dev.crewhub.store club-schedule-api-dev 8081
npm-site locations dev.crewhub.store x 0
# 해당 SHA 의 api 만 기동(web 서비스는 띄우지 않는다)
APP_ENV=dev IMAGE_TAG=<SHA> docker compose up -d api
```

- 다시 최신으로 올리면 CI(또는 위 `docker compose up -d` + `npm-site locations … $(grep -vE '^[[:space:]]*(#|$)' api-routes)` → `npm-site forward … club-schedule-web-dev 80`)가 라우팅을 원래대로 맞춘다.

## 테스트 로그인

프론트엔드 `/login/test` 에서 계정 선택 → 내부적으로 `POST /api/login/test` (`{"kakaoApiId": ...}`). 계정 범위·역할은 `CLAUDE.md` 참고.

## 트러블슈팅

| 증상 | 원인 | 조치 |
|------|------|------|
| `Error creating bean ... DataSource` | DB 연결 실패 | `docker ps` 로 `mariadb-dev` 확인, `dev.env` 의 DB 계정 확인 |
| DB는 붙는데 데이터가 이상함 | 3306(=`mariadb-prod`)에 접속 | bootRun 은 3307, 컨테이너는 `mariadb-dev:3306` |
| 포트 8081 already in use | 이전 bootRun 프로세스가 남아 있음 | `ss -ltnp \| grep 8081` 로 찾아 종료 |
| dev.crewhub.store 502 | 컨테이너 미기동 또는 NPM 전달 대상 불일치 | `docker logs club-schedule-api-dev`, `npm-site list` |

## 관련 문서

- `CLAUDE.md` — 프로젝트 규칙, 테스트 계정
- `docs/DATABASE.md` — 스키마 및 마이그레이션 이력
- 서버 공용 인프라(NPM, MariaDB, 도메인 추가): 서버 `~/infra/README.md`
