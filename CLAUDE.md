# CLAUDE.md — moyora clubSchedule

## 프로젝트 개요
모임/클럽 일정 관리 서비스. 카카오 OAuth 기반 로그인, 모임 생성 신청·승인, 가입 요청, 일정·출석 관리 기능을 포함한다.

## 기술 스택
- **Backend**: Spring Boot 3.4.7, Java 17, MyBatis, MariaDB
- **Frontend**: Thymeleaf, 순수 JS (별도 프레임워크 없음)
- **보안**: Spring Security + JWT (AUTH_TOKEN 쿠키)
- **빌드**: Gradle / IDE: Eclipse
- **서버 포트**: 8081

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

**주의**: 이 프로젝트는 Eclipse Buildship(Gradle 연동, `auto.sync=false`) 프로젝트라 `build.gradle`을 변경한 뒤에는 Eclipse에서 **우클릭 → Gradle → Refresh Gradle Project**를 반드시 해야 `-parameters` 플래그가 실제 컴파일에 반영된다. 새로고침 전이거나 순수 `javac`/다른 빌드 경로에서는 파라미터 이름 미명시 시 런타임 500 오류가 발생하므로, `build.gradle`을 pull 받은 후에는 항상 Gradle Refresh부터 수행한다.

### MyBatis
- `mybatis.configuration.map-underscore-to-camel-case=true` 설정됨
  → 컬럼명 `snake_case` → 필드명 `camelCase` 자동 매핑
- Mapper XML 위치: `src/main/resources/mapper/*.xml`
- Eclipse 빌드 시 XML이 `bin/main/mapper/`로 복사됨
  → **외부 편집 후 Eclipse가 감지 못하면 bin 파일도 동일하게 수동 복사 필요**

### 인증
- JWT를 `AUTH_TOKEN` 쿠키에 저장, JWT 필터가 쿠키를 읽어 `Bearer` 헤더로 변환
- `/admin/**` 경로는 JWT 필터 화이트리스트; 인가는 `@PreAuthorize("hasRole('ADMIN')")`로 처리

### 테스트 계정
- `test01` ~ `test20`: 개발용 테스트 계정 (POST `/login/test` 로 로그인)
- `test01`: ADMIN 권한 보유 → 관리자 테스트 시 사용
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

## 로컬 개발 환경
- DB 접속 정보: `application-private.properties` (git 제외)
- 서버 실행: Eclipse에서 Spring Boot 앱 Run/Debug
