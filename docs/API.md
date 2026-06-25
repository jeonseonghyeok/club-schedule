# Club Schedule API 문서

이 문서는 현재 구현된 API 엔드포인트를 기술합니다.

## 목차

- [공통 규약](#공통-규약)
- [페이징 응답 형식](#페이징-응답-형식-pagingreresponset)
- [관리자 API](#관리자-api)
- [그룹 일정 API](#그룹-일정-api)
- [그룹 멤버 API](#그룹-멤버-api)
- [에러 코드](#에러-코드)
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
3. `group_schedule` 테이블에 INSERT (기본 `status = PENDING`)
4. `useGeneratedKeys`로 발급된 `schedule_id`로 SELECT 후 반환

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
    "displayName": null,
    "role": "LEADER",
    "status": "ACTIVE",
    "joinedAt": "2025-01-01T12:00:00"
  }
]
```

> `displayName`은 현재 미구현 상태입니다 (null 반환).

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

## 보안 주의사항

- Admin API는 `@PreAuthorize("hasRole('ADMIN')")` 로 보호됩니다.
- 일정 생성은 **그룹 멤버 여부**를 서버에서 검증합니다. (`group_member` 테이블 조회)
- 일정 조회(GET)는 인증 없이 접근 가능합니다. 비공개 그룹 지원이 필요한 경우 멤버 검증 추가가 필요합니다.

---

## 향후 개선 사항

1. 일정 수정/삭제: `PUT|PATCH /api/groups/{groupId}/schedules/{scheduleId}`, `DELETE` 구현
2. `schedule_policy` 연동: 그룹 일정 등록 권한 정책(`ALL`/`LEADERS_ONLY`/`APPROVAL_REQUIRED`) 적용
3. 출석 관리: `schedule_attendance` 테이블 기반 참석 신청/확정 API
4. 일정 상태 전환: PENDING → CONFIRMED/REJECTED 처리 API (리더/부방장 전용)
5. `displayName` 조회: 멤버 목록 응답에 `user.nickname` 포함
6. OpenAPI(Swagger) 문서 자동화: `springdoc-openapi` 도입
