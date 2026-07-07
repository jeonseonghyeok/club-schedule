# Club Schedule API 문서

이 문서는 현재 구현된 API 엔드포인트를 기술합니다.

## 목차

- [공통 규약](#공통-규약)
- [페이징 응답 형식](#페이징-응답-형식-pagingreresponset)
- [관리자 API](#관리자-api)
- [그룹 API](#그룹-api)
- [모임 생성 신청 API](#모임-생성-신청-api)
- [그룹 가입 요청 API](#그룹-가입-요청-api)
- [그룹 일정 API](#그룹-일정-api)
- [출석 관리 API](#출석-관리-api)
- [그룹 멤버 API](#그룹-멤버-api)
- [에러 코드](#에러-코드)
- [알려진 이슈](#알려진-이슈)
- [보안 주의사항](#보안-주의사항)

---

## 공통 규약

- 모든 요청/응답 바디는 `application/json`을 사용합니다.
- 타임스탬프(`start`, `end`)는 **epoch milliseconds** (Number) 형식입니다.
- 날짜/시간 문자열(`startAt`, `endAt` 등)은 **ISO 8601** (`yyyy-MM-ddTHH:mm:ss`) 형식입니다.
- 인증은 JWT 기반이며, 쿠키(`AUTH_TOKEN`) 또는 Authorization 헤더로 전달합니다.
- CSRF 보호는 현재 비활성화 상태입니다.

---

## 페이징 응답 형식: `PagingResponse<T>`

페이징 처리된 결과에 사용되는 공통 응답 객체입니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `totalCount` | Number | 전체 레코드 수 |
| `currentPage` | Integer | 현재 페이지 (1 기반) |
| `size` | Integer | 페이지당 항목 수 |
| `totalPages` | Integer | 총 페이지 수 |
| `startPage` | Integer | 현재 블록의 시작 페이지 (블록 크기 5) |
| `endPage` | Integer | 현재 블록의 끝 페이지 |
| `items` | Array\<T\> | 현재 페이지 데이터 |

```json
{
  "totalCount": 123,
  "currentPage": 2,
  "size": 25,
  "totalPages": 5,
  "startPage": 1,
  "endPage": 5,
  "items": []
}
```

---

## 관리자 API

> **권한**: `ADMIN` 역할 필요. 미충족 시 403 반환.

### GET /admin/api/users

회원 목록 조회 (검색·페이징 지원).

**쿼리 파라미터**

| 파라미터 | 필수 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | N | — | 페이지 번호(1 기반). 지정 시 DB-level 페이징 사용 |
| `size` | N | 25 | 페이지 사이즈 |
| `q` | N | — | 닉네임 검색 키워드 |

**응답**: `PagingResponse<UserVo>`

### GET /admin/api/groups

그룹 목록 조회. 파라미터·응답 구조는 `/admin/api/users`와 동일. 응답 타입: `PagingResponse<GroupVo>`.

### GET /admin/api/group-joins

가입 요청 목록 조회. 응답 타입: `PagingResponse<GroupJoinRequestVo>`.

> `page` 미전달 시 전체 목록을 서버에서 슬라이스하는 fallback 방식으로 동작합니다.

### GET /admin/api/group-requests

모임 **생성 신청**(`group_create_request`) 목록 조회 (상태·모임명 필터, 페이징). 가입 요청(`group_join_request`)과는 별개 도메인이므로 혼동 주의.

**쿼리 파라미터**

| 파라미터 | 필수 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | N | — | 페이지 번호(1 기반) |
| `size` | N | — | 페이지 사이즈 |
| `status` | N | — | `PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED` |
| `q` | N | — | 모임명 검색 키워드 |

**응답**: `PagingResponse<Object>` (신청 항목: `requestId`, `groupName`, `userKey`, `requestedAt`, `status`)

### POST /admin/api/group-requests/{requestId}/approve

모임 생성 신청 승인. 승인 시 `group` 레코드가 생성된다.

**응답**: `200 OK` — `{"groupId": Long}` / `409 Conflict` — `{"error": String}` (이미 처리된 신청 등)

### POST /admin/api/group-requests/{requestId}/reject

모임 생성 신청 거부.

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `rejectReason` | String | Y | 거부 사유 |

**응답**: `200 OK` (성공) / `400 Bad Request` (실패)

---

## 그룹 API

### GET /groups/recommended

메인화면 "모임 검색" 섹션용 엔드포인트. `q` 유무에 따라 동작이 분기된다.

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `q` | N | 모임명 검색 키워드. 미지정 시 최근 일정 등록 기준 상위 3개 그룹 반환 |

**권한**: 공개 (인증 불필요)

**응답**: `200 OK` — `GroupVo` 배열 (`groupId`, `name`, `description`, `leaderUserKey`, `capacity`)

> 향후 검색 엔진(ElasticSearch 등) 도입 시 `GroupService.searchByName()` 내부 구현만 교체하면 되도록 설계됨 (API·프론트 무변경).

### GET /groups/me

로그인 사용자가 속한 그룹 목록 조회.

**권한**: 로그인 필요 (미인증 시 `401`)

**응답**: `200 OK` — `GroupVo` 배열

### PATCH /groups/{groupId}

그룹 정보 수정 (이름·설명·정원·자동승인 여부·일정 등록 정책).

**권한**: 리더 또는 부방장 (`@groupManageService.isLeaderOrSubLeader`)

**요청 바디** (`GroupUpdateDto`, 전부 선택)

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | String | 모임 이름 (최대 100자) |
| `description` | String | 모임 설명 (최대 5000자) |
| `capacity` | Integer | 정원 (1~1000) |
| `autoApprove` | Boolean | 가입 자동 승인 여부 |
| `schedulePolicy` | String | `ALL` \| `LEADERS_ONLY` \| `APPROVAL_REQUIRED` |

---

## 모임 생성 신청 API

> `group_create_request` 도메인 (그룹 **가입** 요청과는 별개, [CLAUDE.md](../CLAUDE.md#주요-도메인-구분) 참고). 사용자가 신규 모임 생성을 신청하는 셀프서비스 API이며, 실제 승인/거부 처리는 관리자 패널([관리자 API](#관리자-api)의 `/admin/api/group-requests/*`)에서 이루어진다.

### POST /group-requests

모임 생성 신청 등록.

**권한**: 로그인 필요

**요청 바디**: `GroupRequestDto` — `groupName`, `description`

**응답**: `200 OK` — `{"requestId": Long}` / `409 Conflict` (신청 불가 상태)

### GET /group-requests

내 신청 현황 목록 조회.

### PATCH /group-requests/{requestId}/cancel

본인 신청 취소.

**응답**: `200 OK` / `400 Bad Request` (신청 없음 또는 본인 신청 아님)

> ⚠️ **알려진 이슈**: 이 컨트롤러에도 `POST /group-requests/{requestId}/approve`, `POST /group-requests/{requestId}/reject`가 정의되어 있으나 `@PreAuthorize("hasRole('ROLE_ADMIN')")`로 선언되어 있어 실제로는 `ROLE_ROLE_ADMIN` 권한을 요구한다(Spring `hasRole()`이 `ROLE_` 접두사를 자동으로 붙이기 때문). 실제 관리자 권한(`ROLE_ADMIN`)으로는 항상 403이 발생하며, 프론트엔드 어디에서도 호출하지 않는 죽은 코드다. 승인/거부는 반드시 `/admin/api/group-requests/*`를 사용할 것. 상세: [ROADMAP.md — 기술 부채](ROADMAP.md#기술-부채).

---

## 그룹 가입 요청 API

> `group_join_request` 도메인 (모임 **생성** 신청과는 별개). 기존 그룹에 멤버로 가입 신청하는 API.

### POST /groups/{groupId}/join-requests

가입 신청.

**권한**: 로그인 필요

**응답**: `200 OK` — `{"requestId": Long}`

### DELETE /groups/{groupId}/join-requests/{requestId}

본인 가입 신청 취소.

**응답**: `200 OK` / `400 Bad Request`

### GET /groups/{groupId}/join-requests/me

본인의 가입 신청 목록 조회.

### GET /groups/joins/pending/{groupId}

그룹의 대기 중(PENDING) 가입 신청 목록 조회 (승인 처리용).

### PATCH /groups/joins/{requestId}/approve

가입 신청 승인.

**권한**: 해당 신청이 속한 그룹의 리더 (`isLeaderForRequest`)

**응답**: `200 OK` — `{"ok": true}` / `400 Bad Request` — `{"error": String}`

### PATCH /groups/joins/{requestId}/reject

가입 신청 거부.

**요청 바디**: `{"rejectReason": String}`

**권한**: 해당 신청이 속한 그룹의 리더

---

## 그룹 일정 API

### GET /api/groups/{groupId}/schedules

그룹의 일정 목록을 `group_schedule` 테이블에서 조회합니다.

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `groupId` | Long | 그룹 식별자 |

**권한**: 공개 (인증 불필요)

**응답**: `200 OK` — 이벤트 객체 배열

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Number | 일정 PK (`schedule_id`) |
| `title` | String | 일정 제목 |
| `description` | String\|null | 상세 내용 |
| `locationName` | String\|null | 장소 명칭 |
| `status` | String | 일정 상태: `PENDING` \| `CONFIRMED` \| `REJECTED` \| `CANCELLED` |
| `maxAttendance` | Number | 최대 인원 (0 = 무제한) |
| `createdBy` | Number | 작성자 `user_key` |
| `isCompleted` | Boolean | 최종 종료·정산 여부 |
| `startAt` | String | 시작 시간 (ISO 8601) |
| `endAt` | String\|null | 종료 시간 (ISO 8601) |
| `start` | Number | 시작 시간 (epoch ms, FullCalendar 호환) |
| `end` | Number\|null | 종료 시간 (epoch ms) |

**응답 예시**

```json
[
  {
    "id": 1,
    "title": "정기 모임",
    "description": "5월 정기 모임입니다.",
    "locationName": "강남역 스터디룸",
    "status": "CONFIRMED",
    "maxAttendance": 20,
    "createdBy": 1000001,
    "isCompleted": false,
    "startAt": "2025-05-10T14:00:00",
    "endAt": "2025-05-10T17:00:00",
    "start": 1746871200000,
    "end": 1746882000000
  }
]
```

---

### POST /api/groups/{groupId}/schedules

새 일정을 `group_schedule` 테이블에 저장합니다.

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `groupId` | Long | 그룹 식별자 |

**권한**: 로그인 + 해당 그룹의 ACTIVE 멤버

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | String | **Y** | 일정 제목 (최대 100자) |
| `start` | Number | **Y** | 시작 시간 (epoch ms) |
| `end` | Number | N | 종료 시간 (epoch ms). 미전달 시 null 저장 |
| `content` | String | N | 상세 내용 |
| `location_name` | String | N | 장소 명칭 |
| `latitude` | Number | N | 위도 (decimal) |
| `longitude` | Number | N | 경도 (decimal) |
| `max_attendance` | Number | N | 최대 인원 (기본 0 = 무제한) |

**요청 예시**

```json
{
  "title": "5월 스터디",
  "start": 1746871200000,
  "end": 1746882000000,
  "content": "알고리즘 문제 풀이",
  "location_name": "강남역 스터디룸",
  "max_attendance": 10
}
```

**응답**: `200 OK` — 생성된 일정 객체 (GET 응답 객체와 동일한 형식)

```json
{
  "id": 42,
  "title": "5월 스터디",
  "description": "알고리즘 문제 풀이",
  "locationName": "강남역 스터디룸",
  "status": "PENDING",
  "maxAttendance": 10,
  "createdBy": 1000001,
  "isCompleted": false,
  "startAt": "2025-05-10T14:00:00",
  "endAt": "2025-05-10T17:00:00",
  "start": 1746871200000,
  "end": 1746882000000
}
```

**에러**

| 코드 | 조건 |
|------|------|
| 400 | `title` 또는 `start` 누락 |
| 401 | 미인증 |
| 403 | 그룹 멤버가 아님 |

**내부 동작**

1. JWT에서 `userKey` 추출
2. `group_member.countByGroupAndUser(groupId, userKey) > 0` 으로 멤버 여부 검증
3. `GroupPermissionService.resolveCreatePermission()`이 `group_schedule_policy`(`min_role_to_create`, `requires_approval`)와 역할·개인 예외 권한을 검사해 초기 `status`(`CONFIRMED`/`PENDING`) 결정 — 규칙 상세는 [DATABASE.md](DATABASE.md#일정-권한-검증-우선순위)
4. `group_schedule` 테이블에 INSERT
5. `useGeneratedKeys`로 발급된 `schedule_id`로 SELECT 후 반환

### PATCH /api/groups/{groupId}/schedules/{scheduleId}

일정 수정. 수정 전 상태를 `group_schedule_history`에 스냅샷으로 저장한 뒤 갱신한다.

**권한**: 로그인 필요 (세부 권한은 서비스 레이어에서 검증)

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `changeReason` | String | **Y** | 변경 사유 |
| `title` | String | N | 일정 제목 |
| `content` | String | N | 상세 내용 |
| `location_name` | String | N | 장소 명칭 |
| `latitude` / `longitude` | Number | N | 좌표 |
| `start` / `end` | Number | N | 시작/종료 시간 (epoch ms) |
| `max_attendance` | Number | N | 최대 인원 |

**응답**: `200 OK` — 수정된 일정 객체 / `400 Bad Request` — 정원 검증 등 실패 시 메시지

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/approve

일정 승인 (`PENDING` → `CONFIRMED`). **권한**: LEADER 또는 `MANAGE_SCHEDULE` 권한 보유 MANAGER.

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/reject

일정 반려 (`PENDING` → `REJECTED`). 권한은 승인과 동일.

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/cancel

일정 취소 (`CANCELLED`).

---

## 출석 관리 API

> `schedule_attendance` 테이블 기반. **참가 신청**(attend/cancel/approve/reject/forceCancel)과 **출석 체크**(실제 참석 여부 확인, `actual_status`)는 별개 개념이다 — 전자는 참가 의사를 승인하는 절차, 후자는 일정 종료 후 실제로 참석했는지 기록하는 절차다. `CONFIRMED` 상태의 일정에 멤버가 참가 신청하고, 일정 등록자 또는 MANAGER 이상이 승인·거부·출석체크를 처리한다(단 강제취소는 MANAGER 이상만 가능, 아래 참고). 자동 승인 규칙 및 `is_latest` 상태 전이 규칙은 [DATABASE.md — 출석 관리 규칙](DATABASE.md#출석-관리-규칙) 참고.

### POST /api/groups/{groupId}/schedules/{scheduleId}/attend

참가 신청.

### DELETE /api/groups/{groupId}/schedules/{scheduleId}/attend

본인 참가 취소.

### GET /api/groups/{groupId}/schedules/{scheduleId}/attendance

참가자 목록 조회 (`is_latest=1`인 행만).

**응답**: `200 OK` — 배열, 각 항목: `attendanceId`, `scheduleId`, `userKey`, `displayName`, `status`, `actualStatus`, `processedByUserKey`, `createdAt`

### GET /api/groups/{groupId}/schedules/{scheduleId}/attendance/history

참가 이력(신청/승인/거부/취소) 조회. `is_latest` 조건 없이 해당 일정의 전체 행을 `created_at` 오름차순으로 반환한다 — status 값 자체가 액션을 의미한다(상세: [DATABASE.md — 출석 관리 규칙](DATABASE.md#출석-관리-규칙)).

**응답**: `200 OK` — 배열, 각 항목: `attendanceId`, `userKey`, `displayName`, `status`, `actorUserKey`, `actorDisplayName`, `selfActed`(본인이 처리했는지 여부), `createdAt`

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/attendance/{targetUserKey}/approve

참가 승인. **권한**: 일정 등록자 또는 MANAGER 이상.

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/attendance/{targetUserKey}/reject

참가 거부. 권한은 승인과 동일.

### DELETE /api/groups/{groupId}/schedules/{scheduleId}/attendance/{targetUserKey}

강제 취소. **권한**: MANAGER 이상만 가능 — 승인/거부와 달리 일정 등록자 단독 권한으로는 불가.

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/attendance/{targetUserKey}/check

출석 체크(실제 참석 여부 확인). **정정 가능** — 최초 체크 후에도 재호출로 값을 바꿀 수 있으며, 매 호출마다 변경 전/후 값이 `schedule_attendance_check_history`에 기록된다 (설계: [DATABASE.md — 출석 체크 정정 이력](DATABASE.md#출석-체크-정정-이력)).

**권한**: 일정 등록자 또는 MANAGER 이상 (승인/거부/강제취소와 동일 규칙).

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `actualStatus` | String | N | `ATTENDED` \| `NOSHOW` (미지정 시 기본 `ATTENDED`) |
| `changeReason` | String | N | 정정 사유. 최초 체크 시 생략 가능, 재정정 시 남겨두는 것을 권장 |

---

## 그룹 멤버 API

### GET /api/groups/{groupId}/members

그룹 멤버 목록 조회.

**권한**: 공개

**응답**: `200 OK`

```json
[
  {
    "userKey": 1000001,
    "displayName": "홍길동",
    "role": "LEADER",
    "status": "ACTIVE",
    "joinedAt": "2025-01-01T12:00:00"
  }
]
```

> `displayName`은 `GroupMemberMapper.xml`의 JOIN으로 `user.nickname`을 채워서 반환합니다.

### PATCH /api/groups/{groupId}/members/{userKey}/ban

멤버 강제 탈퇴(KICKED) 처리.

**권한**: 인증 + 리더 또는 부방장

**응답**: `200 OK` (성공) / `401` (미인증) / `403` (권한 없음)

---

## 에러 코드

| 코드 | 의미 |
|------|------|
| 200 | 정상 |
| 400 | 요청 파라미터 오류 (메시지 포함) |
| 401 | 인증 필요 |
| 403 | 권한 부족 (메시지 포함) |
| 500 | 서버 내부 오류 |

---

## 알려진 이슈

| 이슈 | 위치 | 설명 |
|------|------|------|
| 이중 `ROLE_` 접두사로 인한 403 | `GroupRequestController.approveRequest/rejectRequest` | `hasRole('ROLE_ADMIN')`이 실제로는 `ROLE_ROLE_ADMIN`을 요구해 항상 실패. 미사용 죽은 코드. [모임 생성 신청 API](#모임-생성-신청-api) 참고 |

---

## 보안 주의사항

- Admin API는 `@PreAuthorize("hasRole('ADMIN')")` 로 보호됩니다.
- 일정 생성은 **그룹 멤버 여부**를 서버에서 검증합니다. (`group_member` 테이블 조회)
- 일정 조회(GET)는 인증 없이 접근 가능합니다. 비공개 그룹 지원이 필요한 경우 멤버 검증 추가가 필요합니다.

---

## 향후 개선 사항

이 문서는 **구현된** API만 기술한다. 미구현 기능 및 우선순위는 [ROADMAP.md](ROADMAP.md)에서 관리한다.

1. 일정 삭제 API (취소와의 정책 구분 필요)
2. OpenAPI(Swagger) 문서 자동화: `springdoc-openapi` 도입
