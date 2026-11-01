# 운영 현황과 남은 작업

마지막 갱신: 2026-11-01 (master `3cc3c9c`, PR #38 병합 직후)

## 다시 시작할 때

- 화면·규칙 요약은 저장소 루트 `CLAUDE.md`, 아래 "남은 작업"부터 이어서 한다.
- 개발 보조 스크립트(`scripts/dev/`)
  - `sql.sh "<SQL>"` — dev DB(`app_dev`)에 SQL 실행
  - `api.sh <kakaoApiId> <METHOD> <path> [json]` — 테스트 계정으로 로컬 백엔드 API 호출(`BASE=https://dev.crewhub.store` 로 dev 사이트도)
  - `merge-deploy.sh <PR>` — 병합 후 dev 배포 완료까지 대기
- 로컬 실행: 백엔드 `scripts/bootrun-dev.sh`(:8080), 프론트 `cd frontend && npx vite --port 5173`(/api 는 :8080 으로 프록시).
  개발 서버에서 `/g/{id}/`(전용 앱)는 설치 안내 화면이 먼저 나오며, 아래 "개발용: 설치 없이 앱 화면 보기"로 우회한다.

## 최근 작업 (2026-10-26 ~ 11-01, PR #10–#38)

- PWA·UI 개편: 하단 탭(홈·지도·설정), 디자인 토큰, 오프라인 배너·캐시, 설치 안내
- 뒤로가기 규칙(`hooks/useAppBackNavigation.ts`): 앱별 시작 화면을 기록 맨 아래에, 홈에서 두 번 눌러 종료, Android CloseWatcher
- 로그인 강제 없음(비회원 조회), 필요한 동작에서 로그인 안내
- 지도(모임 활동 지역·일정 장소, 카카오맵 키 필요), 장소 검색
- 모임 전용 앱 `/g/{id}/`: 관리자가 켜고 리더가 이름·색 지정, 아이콘 자동 생성, OG 미리보기.
  주소로만 제공, 설치해야 사용(브라우저면 설치 안내만), 우선모임 없음, 로그인·로그아웃 후 그 앱에 머무름(로그아웃은 시작 화면으로 기록 리셋)
- 닉네임: 계정 1개 + 모임별 닉네임(가입 때 복사), 모임장 관리(기본)/본인 수정, 변경 이력(모임 회원 누구나), 계정 변경 시 모임 체크 일괄 반영, 최대 10자
- 회원 관리는 멤버 탭 회원 정보 모달(권한별 직책 변경·닉네임 변경·내보내기, 각각 다음 모달), 관리 탭은 요청·권한(리더)·일정·설정

## 현재 구성

```
브라우저 ─► NPM(443, Let's Encrypt) ─┬─ 기본(모든 화면)  → club-schedule-web-dev:80   React SPA (nginx)
          dev.crewhub.store         └─ /api/            → club-schedule-api-dev:8080 Spring Boot ─► mariadb-dev
```

| 항목 | 상태 |
|---|---|
| 화면 | 모두 `frontend/` React SPA. 백엔드는 `/api/**` 만 응답(Thymeleaf 제거) |
| 배포 | `master` push → GitHub Actions → api·web 이미지(arm64, 커밋 SHA 태그) → 서버 `~/services/club-schedule/` 에서 `docker compose up -d` → `npm-site` 로 NPM 경로 반영 |
| NPM 경로 | 기본 = web, `deploy/api-routes`(현재 `/api/` 하나)만 api. CI 가 매 배포마다 맞춘다 |
| 인증서 | NPM 이 Let's Encrypt(HTTP-01)로 발급·자동 갱신(만료 30일 전). 현재 만료 2027-01-23 |
| 환경변수 | 서버 `~/services/club-schedule/dev.env` (권한 600, git 제외) |
| 서버 공용 인프라 | 서버 `~/infra/README.md` (NPM·MariaDB·도메인 추가 절차, `npm-site` 명령) |

개발·배포·롤백 절차는 [DEV_SERVER.md](DEV_SERVER.md), API 는 [API.md](API.md).

## 검증 이력

- 2026-10-25 배포 직후 실제 dev 사이트에서 브라우저 검사 4종 72항목 통과
  (로그인 13 · 메인 20 · 관리자 15 · 모임 24 — Playwright, 저장소 밖 스크립트)
- 프론트 단위·컴포넌트 테스트 75개(`cd frontend && npm test`), 백엔드 단위 테스트(`GroupRequestServiceTest`)

## 남은 작업

### 실기기 확인 필요(2026-11-01 기준 미확인)
- [ ] 카카오톡 링크 미리보기(OG) — `/g/{id}/`·`/groups/{id}`
- [ ] 카카오톡 인앱 브라우저에서 전용 앱 링크 → "브라우저로 열기"(`kakaotalk://web/openExternal`)
- [ ] 설치한 전용 앱(Android·iOS)에서 카카오 로그인 → 원래 화면 복귀, 뒤로가기에 카카오 화면이 안 나오는지
- [ ] 설치한 전용 앱에서 로그아웃 → 시작 화면, 뒤로가기 두 번에 종료

### 확인 필요
- [ ] **실제 카카오 계정 로그인** — 개발 중에는 카카오 콘솔 미등록 주소라 검증하지 못했다. dev.crewhub.store 에서 한 번 로그인해 확인
- [ ] dev DB 의 E2E 검사 흔적 정리(선택) — 모두 취소 상태: 모임 4 의 "E2E 테스트 일정", 일반멤버01 의 "E2E 테스트 모임" 생성 신청

### 운영 환경(prod) — 미구성
- [ ] `crewhub.store` 는 NPM 이 `my-app-prod:8080`(존재하지 않음)을 가리켜 **502**
- [ ] 필요한 것: `~/services/club-schedule/prod.env`(mariadb-prod 접속), api-prod 는 `db-prod` 망으로 `mariadb-prod` 에 접속(망은 서버 ~/infra/mariadb 가 제공),
  운영 배포 트리거(태그·브랜치 등) 결정, CI 의 `DEPLOY_DOMAIN`·`APP_ENV` 를 운영용으로 분기, NPM `crewhub.store` 를 `club-schedule-web-prod` 로
- [ ] 운영에서는 `TEST_AUTH_SECRET` 을 비워 테스트 로그인 비활성화

### CI 개선
- [ ] **배포 동시 실행 방지**: `deploy.yml` 에 `concurrency: { group: deploy-dev, cancel-in-progress: true }` 가 없어,
  master 에 연달아 병합하면 배포가 동시에 돌고 먼저 시작한 옛 커밋이 나중에 끝나 덮어쓸 수 있다(2026-10-25 병합 때는 수동 취소로 회피)
- [ ] 빌드 전에 검사 단계 추가: 프론트 `npm run typecheck && npm test`, 백엔드 단위 테스트

### DB 마이그레이션
- [x] `migration_v9.sql`(일정 반려·취소 사유, 모임별 닉네임) — dev(`app_dev`) 적용 2026-10-27. NULL 허용 컬럼 추가라 배포 순서 무관
- [x] `migration_v10.sql`(모임 대표 활동 지역) — dev 적용 2026-10-28
- [x] `migration_v11.sql`(모임 전용 앱) — dev 적용 2026-10-29
- [x] `migration_v12.sql`(전용 앱 홈 화면 이름) — dev 적용 2026-10-30
- [x] `migration_v13.sql`(닉네임 관리 기본값·모임 닉네임 채움·변경 이력) — dev 적용 2026-10-31. **코드보다 먼저** 적용(새 코드가 `nickname_history` 에 쓴다)
- [ ] 운영 DB 구성 시 v13 까지 적용

### 카카오맵 (지도 탭·장소 검색)
- [ ] 카카오 개발자 콘솔 clubSchedule 앱: 제품 설정 > 카카오맵 활성화(지금은 `/api/places` 가 503 — `disabled OPEN_MAP_AND_LOCAL service`)
- [ ] 플랫폼 > Web 도메인 등록: https://dev.crewhub.store, https://crewhub.store, http://localhost:5173, http://127.0.0.1:5173
- [ ] JavaScript 키를 `frontend/.env` 의 `VITE_KAKAO_JS_KEY` 에 추가(도메인 제한되는 공개 키)

### 기술 부채 (상세는 [ROADMAP.md](ROADMAP.md#기술-부채))
- `contextLoads` 테스트는 DB·환경변수가 있어야 통과(CI 에서 돌리려면 테스트 프로필 필요)

### 서버 정리 (저장소 밖)
- [ ] `/opt/club-schedule/.env` — 더 이상 쓰지 않음(root 소유): `sudo rm -r /opt/club-schedule`
- [ ] 서버의 GitHub CLI 토큰(`~/.config/gh/hosts.yml`, repo·workflow 권한) — 필요 없으면 `gh auth logout`
- [ ] `~/infra/mariadb/docker-compose.yml` 의 DB 비밀번호가 `[변경 필요]` 표시된 예시값 — 실제 값으로 교체 검토
