# CLAUDE.md — moyora clubSchedule

## 프로젝트 개요
모임/클럽 일정 관리 서비스. 카카오 OAuth 기반 로그인, 모임 생성 신청·승인, 가입 요청, 일정·출석 관리 기능을 포함한다.

## 기술 스택
- **Backend**: Spring Boot 3.4.7, Java 17, MyBatis, MariaDB
- **Frontend**: `frontend/` — React 18 + TS + Vite, TanStack Router/Query, Zustand, Tailwind v4 — 모든 화면(2026-10-25 Thymeleaf 에서 이전 완료)
- **보안**: Spring Security + JWT (AUTH_TOKEN 쿠키)
- **빌드**: Gradle (`backend/`), 개발은 서버에서 직접 (`docs/DEV_SERVER.md`)
- **서버 포트**: 8080 (서버 공통 규칙: api 8080·web 80. 컨테이너 내부 전용, 외부 노출은 NPM)

## 저장소 구조 (모노레포)
```
backend/     Spring Boot 앱 (gradlew, Dockerfile) — 아래 백엔드 경로는 모두 backend/ 기준
frontend/    React SPA (npm, Dockerfile, nginx.conf)
deploy/      compose.yml(배포 정의), .env.example
docs/        설계·운영 문서
scripts/     bootrun-dev.sh 등 개발 스크립트
```

## 패키지 구조
```
com.moyora.clubschedule
├── controller/          # REST 컨트롤러 (/api/** 만, 화면은 frontend/)
│   ├── admin/           # 관리자 전용 (AdminApiController)
│   └── group/           # 그룹 관련 하위 컨트롤러
├── service/             # 비즈니스 로직
├── mapper/              # MyBatis 매퍼 인터페이스
├── vo/                  # DB 매핑 엔티티
├── dto/                 # 요청/응답 DTO
├── security/            # JWT 필터, CustomUserDetails
└── util/
```

## 핵심 규칙

### 컨트롤러 파라미터 명시 (중요)
`build.gradle`에 `-parameters` 컴파일러 플래그가 추가되어 있어, 컨트롤러의 `@RequestParam`/`@PathVariable`/`@RequestHeader`는 이름을 생략한다(변수명 자체가 곧 파라미터명이 된다). 변수명은 항상 요청 파라미터명과 동일하게 짓는다 — 다른 이름을 쓰지 않으므로 `value`/`name` 속성으로 이름을 명시해야 하는 경우는 없다.

```java
@RequestParam(required = false) Integer page
@PathVariable Long requestId
@RequestParam(required = false) Long from
```

`-parameters` 플래그가 컴파일에 반영되지 않으면(Gradle 이외 경로로 컴파일 등) 파라미터 이름 미명시 시 런타임 500 오류가 발생한다. 항상 `./gradlew` 로 빌드한다.

### MyBatis
- `mybatis.configuration.map-underscore-to-camel-case=true` 설정됨
  → 컬럼명 `snake_case` → 필드명 `camelCase` 자동 매핑
- Mapper XML 위치: `backend/src/main/resources/mapper/*.xml`

### 인증
- JWT를 `AUTH_TOKEN` 쿠키에 저장, JWT 필터가 쿠키를 읽어 `Bearer` 헤더로 변환
- 토큰 없이 허용되는 경로는 `/api/login/**`·`/api/auth/logout` 와, 비회원 조회용 GET(`WhitelistConfig.PUBLIC_GET`: 모임 검색·모임 상세·모임 일정·지도 모임) 뿐이다. 로그인은 강제하지 않고 필요한 동작에서 `useLoginPrompt` 로 안내한다. 관리자 API(`/api/admin/**`) 인가는 `@PreAuthorize("hasRole('ADMIN')")`
- 인증 실패는 항상 JSON 401 — 로그인 안내·이동은 프론트엔드가 처리

### 테스트 계정
- 프론트엔드 `/login/test` 화면에서 계정을 선택해 로그인(내부적으로 POST `/api/login/test`, body `{"kakaoApiId": ...}`, 목록은 GET `/api/login/test/accounts`)
- 테스트 계정은 kakaoApiId `9900000000001` ~ `9900000000048` 범위이며, 화면·API 응답에는 `nickname`으로 표시된다(로그인 식별자는 어디까지나 kakaoApiId이고 닉네임은 역할 구분용 라벨일 뿐). 시드 스크립트: `docs/test-data.sql`.
  - `9900000000001` ~ `9900000000003`: 닉네임 "관리자01" ~ "관리자03" — `system_role='ADMIN'` 실제 권한 보유 → 관리자 테스트 시 사용
  - `9900000000004` ~ `9900000000008`: 닉네임 "모임리더01" ~ "모임리더05" — 역할극용 라벨일 뿐 시스템 권한은 일반 USER. 실제 LEADER 권한을 테스트하려면 대상 그룹의 `group_member.role`을 별도로 LEADER로 지정해야 함
  - `9900000000009` ~ `9900000000018`: 닉네임 "모임매니저01" ~ "모임매니저10" — 위와 동일하게 라벨일 뿐이며, 실제 MANAGER 권한은 그룹별로 `group_member.role`을 MANAGER로 지정해야 함
  - `9900000000019` ~ `9900000000048`: 닉네임 "일반멤버01" ~ "일반멤버30"인 일반 테스트 계정
- 테스트 스크립트: `scripts/test-join-requests.ps1`

## 프론트엔드
- 규약은 `frontend-conventions` / `react-component` / `data-layer` 스킬을 따른다.
- 구조: `src/routes/`(파일 기반 라우트, 얇게) · `src/components/<Feature>|common|layout/` · `src/modules/api/<domain>/`(axios) ·
  `src/modules/stores/server/<domain>/`(queries·mutations) · `src/modules/stores/client/`(`createStore`) · `src/types/`
- API 는 같은 출처 `/api/**` 만 호출한다(쿠키 인증). 에러 바디는 `ServerError {error, message}`.
- React Compiler 활성 — `useMemo`/`useCallback`/`memo` 를 손수 추가하지 않는다.
- `src/routeTree.gen.ts` 는 라우터 플러그인이 생성한다(커밋 대상, 직접 수정·포맷 금지).
- `.npmrc` 의 `legacy-peer-deps` 때문에 피어 의존성이 자동 설치되지 않는다 — 필요하면 직접 추가한다.
- 디자인 토큰은 `src/styles.css` 의 `@theme`(brand 색, gray 를 브랜드 쪽 중립색으로 재정의). 새 색을 하드코딩하지 말고 `brand-*`/`gray-*` 를 쓴다.
- PWA: `public/manifest.webmanifest`, `public/sw.js`(정적 파일만 캐시, `/api` 는 항상 네트워크), 아이콘 원본 `public/icons/icon.svg`. 서비스 워커는 운영 빌드에서만 등록한다.
  모임 전용 앱은 `/api/groups/{id}/app-manifest`(scope·start_url `/g/{id}/`) — `/g/` 로 바로 들어오면 nginx 가 index.html 의 manifest 링크를 바꾸고, 화면에서도 `useGroupAppHead` 가 맞춘다. 아이콘은 `utils/appIcon.ts` 가 캔버스로 그려 올린다.
  iOS 홈 화면 앱은 추가할 때 주소로 시작하므로 `main.tsx` 가 실행 때마다 그 앱의 시작 화면으로 맞춘다.
- 링크 미리보기: `/g/{id}/`·`/groups/{id}` 는 web nginx 가 SSI 로 `/api/groups/{id}/og` 조각을 index.html 에 넣는다.
  nginx.conf 는 템플릿(`API_UPSTREAM` — compose 가 환경별 api 컨테이너로 채움)이다.

## 주요 도메인 구분
| 도메인 | 설명 |
|--------|------|
| `group_create_request` | 모임 **생성 신청** (GroupRequestController, GroupRequestService) |
| `group_join_request` | 모임 **가입 요청** (GroupJoinRequestController) |

두 도메인은 완전히 별개이며 혼동 주의.

### 닉네임
- 닉네임은 계정·모임 모두 최대 10자(`GroupManageService.NICKNAME_MAX`, 프론트 `NICKNAME_MAX_LENGTH`). 계정 닉네임(`user.nickname`)은 계정당 하나. 모임 닉네임(`group_member.nickname`)은 가입 때 계정 닉네임을 복사해 모임마다 따로 둔다 — 계정 이름을 바꿔도 모임 이름은 그대로이고, 설정 화면에서 같이 바꿀 모임을 체크한다(`PATCH /api/users/me` 의 `groupIds`).
- 모임 설정 `allow_self_nickname`: 0(기본)=모임장·매니저가 관리(회원 정보에서 수정), 1=회원도 직접 수정. 모임장·매니저는 항상 자기·회원 이름을 바꿀 수 있다.
- 모든 변경은 `nickname_history`(group_id NULL=계정)에 남는다 — 모임 이력은 같은 모임 회원 누구나(멤버 탭 회원 정보), 계정 이력은 본인(설정 > 변경 이력)이 본다. `NicknameService`·`GroupManageService`.

## 화면(frontend/src/routes)
모든 화면은 `AppShell`(상단 바 + 주 메뉴: 휴대폰은 하단 탭바, md 이상은 왼쪽 레일) 안에 그린다. 주 메뉴는 홈·지도·설정.
뒤로가기 규칙(`hooks/useAppBackNavigation.ts`, 루트에서 한 번): 앱(모요라 `/`, 모임 전용 앱 `/g/{id}/`)마다 시작 화면을 기록 맨 아래에 두고, 그 밖의 화면의 뒤로가기는 항상 시작 화면으로,
열린 대화상자가 있으면 그것부터 닫는다. 홈에서는 첫 뒤로가기에 "한 번 더 누르면 종료" 안내, 두 번째에 앱을 나간다.
화면 안 탭·하위 메뉴 이동은 `replace` 로 기록을 쌓지 않고, "홈으로" 동작은 `useGoHome` 을 쓴다.
Chrome 은 사용자 상호작용 전에 쌓은 기록을 뒤로가기 때 건너뛰므로, 홈 끼워 넣기·종료 확인 기록은 첫 탭/키 입력 뒤에 쌓는다.
Android 는 `CloseWatcher` 로 기록 없이 뒤로가기를 받아, 링크로 막 열린 화면에서 바로 누른 뒤로가기도 시작 화면으로 보낸다.

| URL | 화면 |
|-----|------|
| `/` | 홈 — 내 모임·모임 찾기·모임 생성 신청 (우선모임이 있으면 그 모임으로, `?list=1` 이면 목록 — 하단 탭 홈은 `list=1`) |
| `/groups/$groupId?tab=home\|schedule\|members\|manage&section=requests\|permissions\|schedules\|settings` | 모임 — 홈·일정 달력·멤버·관리(요청/권한(리더)/일정/설정). 회원 관리는 멤버 탭: 회원을 누르면 회원 정보(닉네임 이력 — 회원 누구나)와 권한별 직책 변경·닉네임 변경·내보내기(각각 다음 대화상자), 매니저 이상은 정지 회원·벤. ⋯ 메뉴: 참가 이력·내 정보·탈퇴 |
| `/map?view=groups\|schedules` | 지도 — 모임 활동 지역 / 내 모임 일정 장소. 카카오맵 키(`VITE_KAKAO_JS_KEY`)가 없으면 목록만 |
| `/settings` | 설정 — 계정 닉네임(같이 바꿀 모임 체크)·모임 닉네임·변경 이력, 우선모임, 앱 설치, 관리자 링크, 로그아웃 |
| `/g/$groupId/?tab=home\|schedule\|members\|manage\|me` | 모임 전용 앱(모임별 PWA, 시스템 관리자가 켠 모임만) — `GroupAppShell`(그 모임 메뉴만). **주소로 들어온 사람에게만 제공**, **설치해야 쓸 수 있다** — 브라우저로 열면 `InstallGate`(설치 방법·카카오톡 등 인앱 브라우저는 외부 브라우저로 열기, 개발 서버만 우회 버튼)만 보인다 — 모요라 화면에는 표시·링크를 두지 않고, 전용 앱도 모요라로 넘어가는 링크를 두지 않는다(두 앱을 오가면 뒤로가기가 꼬인다). 우선모임(모요라 시작 모임)은 전용 앱에 보이지도, 동작하지도 않는다. 끝의 `/` 가 설치 범위라 라우터는 `trailingSlash: 'preserve'` |
| `/admin?tab=users\|groups\|groupRequests\|groupJoins` | 관리자 대시보드 (설정에서 진입) |
| `/login/kakao/login_callback` | 카카오 로그인 콜백(카카오 콘솔 redirect URI) |
| `/login/test` | 테스트 로그인(개발 전용) |

## 개발 환경
- 개발은 서버(`~/workspace/club-schedule`)에서 직접 한다 — 상세는 `docs/DEV_SERVER.md`
- 운영 현황·남은 작업(운영 환경 미구성, CI 개선, 기술 부채)은 `docs/OPERATIONS.md` — 작업을 마치면 갱신한다
- **DB**: `mariadb-dev` / **`app_dev`** (MariaDB 11.2)
  - 컨테이너(배포본): `jdbc:mariadb://mariadb-dev:3306/app_dev` (`app-network`)
  - 호스트 bootRun: `127.0.0.1:3307` (`scripts/bootrun-dev.sh` 가 자동 치환)
- 환경변수: 서버 `~/services/club-schedule/dev.env` (git 제외, 템플릿 `deploy/.env.example`)
- 배포: `master` push → CI → `deploy/compose.yml` 로 `club-schedule-api-dev` 컨테이너 기동
- 스키마: `docs/club-schedue_DLL.sql` + `docs/DATABASE.md` migration 이력 — Flyway 없음, 수동 적용
