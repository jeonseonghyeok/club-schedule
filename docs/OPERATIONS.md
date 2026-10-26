# 운영 현황과 남은 작업

마지막 갱신: 2026-10-25 (master `fe8adbc`, PR #1–#9 병합 직후)

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

### 기술 부채 (상세는 [ROADMAP.md](ROADMAP.md#기술-부채))
- 관리자 검색 필터(권한·기간 등)는 API 가 받지 않아 화면에서 뺐다 — 필요하면 API·매퍼부터 추가
- 일정 거부·취소 사유는 API 가 저장하지 않아 입력을 뺐다 — 남기려면 API·서비스·이력 테이블에 추가
- `contextLoads` 테스트는 DB·환경변수가 있어야 통과(CI 에서 돌리려면 테스트 프로필 필요)

### 서버 정리 (저장소 밖)
- [ ] `/opt/club-schedule/.env` — 더 이상 쓰지 않음(root 소유): `sudo rm -r /opt/club-schedule`
- [ ] 서버의 GitHub CLI 토큰(`~/.config/gh/hosts.yml`, repo·workflow 권한) — 필요 없으면 `gh auth logout`
- [ ] `~/infra/mariadb/docker-compose.yml` 의 DB 비밀번호가 `[변경 필요]` 표시된 예시값 — 실제 값으로 교체 검토
