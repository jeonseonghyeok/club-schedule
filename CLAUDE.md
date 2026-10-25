# CLAUDE.md — moyora clubSchedule

## 프로젝트 개요
모임/클럽 일정 관리 서비스. 카카오 OAuth 기반 로그인, 모임 생성 신청·승인, 가입 요청, 일정·출석 관리 기능을 포함한다.

## 기술 스택
- **Backend**: Spring Boot 3.4.7, Java 17, MyBatis, MariaDB
- **Frontend**: Thymeleaf, 순수 JS (별도 프레임워크 없음)
- **보안**: Spring Security + JWT (AUTH_TOKEN 쿠키)
- **빌드**: Gradle (`backend/`), 개발은 서버에서 직접 (`docs/DEV_SERVER.md`)
- **서버 포트**: 8081 (컨테이너 내부 전용, 외부 노출은 NPM)

## 저장소 구조 (모노레포)
```
backend/     Spring Boot 앱 (gradlew, Dockerfile) — 아래 경로는 모두 backend/ 기준
deploy/      compose.yml(배포 정의), .env.example
docs/        설계·운영 문서
scripts/     bootrun-dev.sh 등 개발 스크립트
```

## 패키지 구조
```
com.moyora.clubschedule
├── controller/          # MVC 컨트롤러 (페이지 반환)
│   ├── admin/           # 관리자 전용 (AdminApiController, AdminViewController)
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
- `/admin/**` 경로는 JWT 필터 화이트리스트; 인가는 `@PreAuthorize("hasRole('ADMIN')")`로 처리

### 테스트 계정
- `http://127.0.0.1:8081/login/test` 페이지에서 계정을 선택해 로그인(내부적으로 POST `/api/login/test`, body `{"kakaoApiId": ...}`)
- 테스트 계정은 kakaoApiId `9900000000001` ~ `9900000000048` 범위이며, 화면·API 응답에는 `nickname`으로 표시된다(로그인 식별자는 어디까지나 kakaoApiId이고 닉네임은 역할 구분용 라벨일 뿐). 시드 스크립트: `docs/test-data.sql`.
  - `9900000000001` ~ `9900000000003`: 닉네임 "관리자01" ~ "관리자03" — `system_role='ADMIN'` 실제 권한 보유 → 관리자 테스트 시 사용
  - `9900000000004` ~ `9900000000008`: 닉네임 "모임리더01" ~ "모임리더05" — 역할극용 라벨일 뿐 시스템 권한은 일반 USER. 실제 LEADER 권한을 테스트하려면 대상 그룹의 `group_member.role`을 별도로 LEADER로 지정해야 함
  - `9900000000009` ~ `9900000000018`: 닉네임 "모임매니저01" ~ "모임매니저10" — 위와 동일하게 라벨일 뿐이며, 실제 MANAGER 권한은 그룹별로 `group_member.role`을 MANAGER로 지정해야 함
  - `9900000000019` ~ `9900000000048`: 닉네임 "일반멤버01" ~ "일반멤버30"인 일반 테스트 계정
- 테스트 스크립트: `scripts/test-join-requests.ps1`

## 주요 도메인 구분
| 도메인 | 설명 |
|--------|------|
| `group_create_request` | 모임 **생성 신청** (GroupRequestController, GroupRequestService) |
| `group_join_request` | 모임 **가입 요청** (GroupJoinRequestController) |

두 도메인은 완전히 별개이며 혼동 주의.

## 관리자 패널
- URL: `/admin`
- JS 구조:
  - `admin.js` — 탭 전환, 패널 로드, 이벤트 버스
  - `admin-renderer.js` — 각 패널 전용 렌더러 (`renderUsers`, `renderGroupRequests` 등)
- 이벤트:
  - `admin:search:results` — 검색 결과 렌더링 트리거
  - `admin:reload:panel` — 승인/거부 후 패널 새로고침

## 개발 환경
- 개발은 서버(`~/workspace/club-schedule`)에서 직접 한다 — 상세는 `docs/DEV_SERVER.md`
- **DB**: `mariadb-dev` / **`app_dev`** (MariaDB 11.2)
  - 컨테이너(배포본): `jdbc:mariadb://mariadb-dev:3306/app_dev` (`app-network`)
  - 호스트 bootRun: `127.0.0.1:3307` (`scripts/bootrun-dev.sh` 가 자동 치환)
- 환경변수: 서버 `~/services/club-schedule/dev.env` (git 제외, 템플릿 `deploy/.env.example`)
- 배포: `master` push → CI → `deploy/compose.yml` 로 `club-schedule-api-dev` 컨테이너 기동
- 스키마: `docs/club-schedue_DLL.sql` + `docs/DATABASE.md` migration 이력 — Flyway 없음, 수동 적용
