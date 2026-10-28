# Club Schedule API 문서

현재 구현된 REST API 를 컨트롤러 코드 기준으로 정리한다. 미구현 기능과 우선순위는 [ROADMAP.md](ROADMAP.md).

## 목차

- [공통 규약](#공통-규약)
- [에러 응답](#에러-응답)
- [로그인 API](#로그인-api)
- [그룹 API](#그룹-api)
- [모임 생성 신청 API](#모임-생성-신청-api)
- [그룹 가입 요청 API](#그룹-가입-요청-api)
- [그룹 일정 API](#그룹-일정-api)
- [참석 관리 API](#참석-관리-api)
- [그룹 멤버 API](#그룹-멤버-api)
- [알림 API](#알림-api)
- [지도·장소 API](#지도장소-api)
- [관리자 API](#관리자-api)

---

## 공통 규약

- 모든 API 는 `/api/**` 아래에 있다. 백엔드는 화면을 서빙하지 않는다(화면은 `frontend/` SPA).
- 요청·응답 바디는 `application/json`.
- **인증**: httpOnly `AUTH_TOKEN` 쿠키(JWT). `Authorization: Bearer` 헤더도 받는다.
  토큰 없이 허용되는 경로는 `/api/login/**` 와 `/api/auth/logout` 뿐이며, **그 외 모든 API 는 로그인이 필요하다**(없으면 401).
- CSRF 보호는 비활성화되어 있다(쿠키 `SameSite=Lax`).
- **시각 형식**
  | 구분 | 형식 |
  |---|---|
  | 일정 요청 `start`/`end` | epoch milliseconds (Number) |
  | 일정 응답 | `start`/`end`(epoch ms) + `startAt`/`endAt`(ISO LocalDateTime) |
  | 그 밖의 날짜 | ISO LocalDateTime `yyyy-MM-ddTHH:mm:ss` (타임존 없음, 서버 KST) |
  | 알림 `createdAt` | ISO Instant (`...Z`) |

### 페이징 응답 형식: `PagingResponse<T>`

| 필드 | 타입 | 설명 |
|------|------|------|
| `totalCount` | Number | 전체 레코드 수 |
| `currentPage` | Integer | 현재 페이지 (1 기반) |
| `size` | Integer | 페이지당 항목 수 |
| `totalPages` | Integer | 총 페이지 수 |
| `startPage` / `endPage` | Integer | 현재 페이지 블록(5개 단위)의 시작·끝 |
| `items` | Array\<T\> | 현재 페이지 데이터 |

---

## 에러 응답

실패 응답은 **항상** 아래 형태다(필터의 401, `@PreAuthorize` 403, 컨트롤러·서비스 오류 모두 동일).

```json
{ "error": "Forbidden", "message": "모임 회원만 볼 수 있습니다." }
```

| 코드 | `error` | 의미 |
|---|---|---|
| 400 | `BadRequest` | 입력값 오류 |
| 401 | `Unauthorized` | 로그인 필요·만료 |
| 403 | `Forbidden` | 권한 없음 |
| 404 | `NotFound` | 대상 없음 |
| 409 | `Conflict` | 현재 상태에서 처리 불가(이미 처리됨, 정원 초과 등) |
| 502 | `BadGateway` | 카카오 토큰 발급 실패 |
| 503 | `ServiceUnavailable` | 테스트 로그인 비활성 |
| 500 | `InternalServerError` | 예기치 못한 오류(상세는 서버 로그에만) |

`message` 는 사용자에게 그대로 보여줄 수 있는 문장이다. 컨트롤러는 `exception/ApiErrors`, 예외는
`GlobalExceptionHandler` 가 이 형태로 만든다.

---

## 로그인 API

### GET /api/auth/me
로그인 사용자 정보. `{"userKey", "nickname", "roles": [{"authority": "ROLE_USER"}], "isAdmin", "favoriteGroupId": Number|null}`
— `favoriteGroupId` 가 있으면 메인 화면이 그 모임으로 이동한다(`/?list=1` 이면 이동하지 않음).

### POST /api/login/kakao
카카오 인가 코드로 로그인(미가입 시 자동 가입). 성공 시 `AUTH_TOKEN` 쿠키를 설정하고 `{"returnPath": "/"}` 를 반환한다.
- Body: `{"code", "redirectUri", "returnTo"}` — `redirectUri` 는 인가 요청 때와 같아야 하고 경로가 `KAKAO_REDIRECT_WHITELIST` 에 있어야 한다.
- 에러: 403 redirect_uri 불허 · 502 카카오 토큰 발급 실패 · 500 자동 가입 실패.

### POST /api/auth/logout
로그아웃 — `AUTH_TOKEN` 을 만료 쿠키(`Max-Age=0`)로 덮어쓰고 204. 토큰이 만료돼도 호출할 수 있도록 인증 없이 허용한다.

### PATCH /api/users/me
계정 닉네임 변경. Body `{nickname}`(1~30자) → `{nickname}`. 모임 닉네임이 없는 모임에서는 이 이름이 보인다.

### GET /api/login/test/accounts · POST /api/login/test
테스트 계정 목록 `[{"kakaoApiId", "nickname"}]` / Body `{"kakaoApiId"}` 로 로그인 → `{"userKey", "nickname"}` + 쿠키.
`TEST_AUTH_SECRET` 이 비어 있으면 503.

---

## 그룹 API

### GET /api/groups/me
내가 속한(ACTIVE) 모임 목록 — `GroupVo[]` (`groupId`, `name`, `description`, `leaderUserKey`, `capacity`, `currentMemberCount`,
`allowSelfNickname`, `regionName`, `myNickname`(이 모임에서 내 닉네임) …).

### GET /api/groups/recommended?q=
`q` 가 있으면 모임명 검색, 없으면 최근 일정이 등록된 모임 상위 3개.

### GET /api/groups/{groupId}
모임 화면용 상세. 없으면 404.

```json
{
  "group": { "groupId": 4, "name": "모임01", "description": "...", "leaderUserKey": 1000108, "capacity": 50, "autoApprove": false, ... },
  "visibilityType": "PUBLIC | PARTIAL | PRIVATE",
  "viewer": {
    "userKey": 1000108, "isLeader": true, "isManager": true, "isMember": true,
    "canCreateSchedule": true, "createNeedsApproval": false, "canManageSchedule": true,
    "isFavoriteGroup": false, "hasFavoriteGroup": false
  }
}
```

화면의 권한 분기는 `viewer` 로 한다.

### GET /api/groups/{groupId}/settings
모임 설정(관리 탭 "모임 기본 정보"·"운영 정책"). **권한**: 리더·매니저.

```json
{
  "groupId": 4, "name": "모임01", "description": null, "capacity": 50, "autoApprove": false,
  "allowSelfNickname": true, "activeMemberCount": 17,
  "policy": {
    "minRoleToCreate": "LEADER | MANAGER | MEMBER",
    "requiresApproval": false,
    "defManagerCanManageSchedule": true,
    "requiresAttendanceApproval": false,
    "visibilityType": "PUBLIC | PARTIAL | PRIVATE"
  }
}
```

`policy` 는 `group_schedule_policy` 로, 일정 등록·승인·참가 승인·공개 범위 판단에 실제로 쓰인다
([DATABASE.md](DATABASE.md#일정-권한-검증-우선순위)). `minRoleToCreate` 가 `LEADER`·`MANAGER` 면 일반회원만 등록할 수 없고
(매니저는 항상 등록 가능, 일정관리자 권한이 없으면 승인 대기), `MEMBER` 면 모든 회원이 등록할 수 있다.

### PATCH /api/groups/{groupId}
기본 정보 수정. **권한**: 리더·매니저. Body 는 모두 선택: `name`(1~100자, 공백만 불가), `description`(≤5000자),
`capacity`(1~1000, 현재 활동 회원 수 이상), `autoApprove`, `allowSelfNickname`(회원 본인의 모임 닉네임 수정 허용). 응답: 저장된 settings(위와 같은 형태).

`autoApprove` 가 켜져 있으면 가입 신청이 정원 안에서 즉시 승인된다([가입 요청](#그룹-가입-요청-api)).

### PUT /api/groups/{groupId}/region
대표 활동 지역(지도 표시). **권한**: 리더·매니저. Body `{regionName, latitude, longitude}` — 이름이 비고 좌표가 없으면 해제,
위도·경도는 함께. 응답: 저장된 settings(`regionName`, `latitude`, `longitude` 포함).

### PUT /api/groups/{groupId}/policy
일정 운영 정책 전체 교체. **권한**: 리더. Body 는 `policy` 의 다섯 필드 모두 필수. 응답: 저장된 settings.

### PUT / DELETE /api/groups/{groupId}/favorite
우선모임(즐겨찾기) 지정 / 해제. 지정은 그 모임 회원만(아니면 403).

---

## 모임 생성 신청 API

> `group_create_request` 도메인 — 그룹 **가입** 요청과 별개. 승인·거부는 [관리자 API](#관리자-api).

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/group-requests` | Body `{groupName, description}` → `{requestId}`. 대기 중 신청이 있거나 이미 리더인 모임이 있으면 409 |
| GET | `/api/group-requests` | 내 신청 목록 |
| PATCH | `/api/group-requests/{requestId}/cancel` | 본인 신청 취소. 취소할 신청이 없으면 400 |

---

## 그룹 가입 요청 API

> `group_join_request` 도메인 — 기존 모임에 가입 신청한다.

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/groups/{groupId}/join-requests` | 로그인 | `{requestId, status}` — 자동 승인 모임이고 정원이 남아 있으면 `APPROVED`(바로 회원), 아니면 `PENDING`. 이미 회원·중복 신청 409, 차단된 사용자 403 ([차단 규칙](DATABASE.md#회원-상태-및-차단벤-규칙)) |
| DELETE | `/api/groups/{groupId}/join-requests/{requestId}` | 본인 | 신청 취소 |
| GET | `/api/groups/{groupId}/join-requests/me` | 로그인 | 내 신청 목록(최신순) |
| GET | `/api/groups/joins/pending/{groupId}` | **리더** | 대기 중 신청 목록 |
| PATCH | `/api/groups/joins/{requestId}/approve` | 리더 | `{ok}`. 정원 초과·이미 회원 400 |
| PATCH | `/api/groups/joins/{requestId}/reject` | 리더 | Body `{rejectReason}` |

---

## 그룹 일정 API

### GET /api/groups/{groupId}/schedules?from=&to=
일정 목록. `from`/`to`(epoch ms)를 주면 그 기간의 시작 일정만, 없으면 전체.
비회원은 `visibilityType` 에 따라 제한된다(PRIVATE: 없음 · PARTIAL: 확정된 향후 일정 일부 · PUBLIC: 확정된 향후 일정 전체).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Number | 일정 PK |
| `title` / `description` / `locationName` | String | `description` 은 요청의 `content` |
| `latitude` / `longitude` | Number\|null | 장소 좌표 |
| `status` | String | `PENDING` \| `CONFIRMED` \| `REJECTED` \| `CANCELLED` |
| `statusReason` | String\|null | 거부·취소 사유(그 밖의 상태에서는 null) |
| `maxAttendance` | Number | 0 = 무제한 |
| `createdBy` | Number | 작성자 userKey |
| `isCompleted` | Boolean | |
| `startAt` / `endAt` | String | ISO LocalDateTime |
| `start` / `end` | Number | epoch ms |
| `confirmedCount` | Number | 참가 확정 인원 — CONFIRMED 일정에만 |
| `myAttendanceStatus` | String\|null | 내 참가 상태 — CONFIRMED 일정에만 |

### POST /api/groups/{groupId}/schedules
**권한**: 모임 회원 + 일정 등록 정책([DATABASE.md](DATABASE.md#일정-권한-검증-우선순위)). 초기 상태는 정책에 따라 `CONFIRMED` 또는 `PENDING`.
확정되면 작성자가 자동으로 참가 등록된다.

| 필드 | 필수 | 설명 |
|------|:-:|------|
| `title` | Y | 최대 100자 |
| `start` | Y | epoch ms |
| `end` | | epoch ms |
| `content` | | 상세 내용 |
| `location_name` | | 장소 |
| `latitude` / `longitude` | | 좌표 |
| `max_attendance` | | 기본 0(무제한) |

> 요청 본문의 키는 snake_case(`location_name`, `max_attendance`)이고 응답은 camelCase 다.

응답: 생성된 일정(목록 항목과 같은 형태).

### PATCH /api/groups/{groupId}/schedules/{scheduleId}
수정. 위 필드 + **`changeReason`(필수)**. 수정 전 상태를 `group_schedule_history` 에 남기고, 참가 확정 회원에게 알림을 보낸다.
`max_attendance` 를 빼면 0(무제한)으로 저장되므로 항상 현재 값을 보낸다. 정원을 확정 인원보다 작게 바꾸면 400.

### PATCH /api/groups/{groupId}/schedules/{scheduleId}/approve · /reject · /cancel
승인(`PENDING`→`CONFIRMED`) · 반려(`PENDING`→`REJECTED`) · 취소(→`CANCELLED`). 변경된 일정을 반환한다.
- 반려·취소는 Body `{reason}`(선택, 500자 이하 — 넘으면 400)을 받아 `statusReason` 에 남기고, 작성자(반려)·참가 확정 회원(취소) 알림에 붙인다.
- 승인·반려: 리더 또는 일정 관리 권한 매니저.
- 취소: 본인의 PENDING 일정은 작성자, 그 외는 승인 권한과 같다.
- 상태가 맞지 않으면 409.

---

## 참석 관리 API

> `schedule_attendance` 기반. **참가 신청**(참가 의사를 승인하는 절차)과 **참석 체크**(시작 이후 실제 참석 기록)는 별개다.
> 자동 승인·`is_latest` 규칙은 [DATABASE.md — 참가 관리 규칙](DATABASE.md#참가-관리-규칙).

| Method | Path (`/api/groups/{groupId}/schedules/{scheduleId}` 기준) | 권한 | 설명 |
|---|---|---|---|
| POST | `/attend` | 회원 | 참가 신청. CONFIRMED 일정만 |
| DELETE | `/attend` | 본인 | 참가 취소. 일정 시작 전만 |
| GET | `/attendance` | 모임 회원 | 참가자(최신 상태): `attendanceId, userKey, displayName, status, actualStatus, processedByUserKey, createdAt, checkedAt, checkedByUserKey` |
| GET | `/attendance/history` | 모임 회원 | 처리 이력(시간순): `attendanceId, userKey, displayName, status, actorUserKey, actorDisplayName, selfActed, createdAt` |
| PATCH | `/attendance/{targetUserKey}/approve` | 일정 등록자·출석 관리 권한 | 참가 승인 |
| PATCH | `/attendance/{targetUserKey}/reject` | 〃 | 참가 거부 |
| DELETE | `/attendance/{targetUserKey}` | 매니저 이상 | 강제 취소(일정 등록자 단독으로는 불가) |
| PATCH | `/attendance/{targetUserKey}/check` | 일정 등록자·출석 관리 권한 | Body `{actualStatus: ATTENDED\|NOSHOW}`. 시작 이후만, 재호출로 정정 |

모임 단위:

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/groups/{groupId}/attendance/roster?scheduleIds=1,2` | 모임 회원 | 팝오버용 명단 `{"1": [{displayName, status}]}` |
| GET | `/api/groups/{groupId}/attendance/me` | 로그인 | 내 참가 이력 `[{scheduleId, scheduleTitle, scheduleStartAt, status, actualStatus}]` |

---

## 그룹 멤버 API

### GET /api/groups/{groupId}/members
**권한**: 모임 회원. 활동·탈퇴·추방 회원 모두 반환한다.

```json
[{
  "userKey": 1000001, "displayName": "길동이", "groupNickname": "길동이", "role": "MANAGER", "status": "ACTIVE",
  "joinedAt": "2025-01-01T12:00", "leftAt": null, "banned": false, "banReason": null,
  "presets": ["SCHEDULE_MANAGER"]
}]
```

`displayName` 은 모임 닉네임(`groupNickname`)이 있으면 그것, 없으면 계정 닉네임이다 — 참가자·명단·이력의 `displayName` 도 같다.
`presets` 는 활동 중인 매니저에게만 있다. `banned` 는 `group_join_ban.active=1` 여부
([DATABASE.md — 회원 상태 및 차단(벤) 규칙](DATABASE.md#회원-상태-및-차단벤-규칙)).

### PATCH /api/groups/{groupId}/members/me/nickname
내 모임 닉네임. Body `{nickname}` — 비우면(null·공백) 계정 닉네임으로 돌아간다. 응답 `{groupNickname}`.
30자 초과 400, 같은 모임의 다른 활동 회원이 쓰는 표시 이름이면 409, 회원이 아니면 409,
모임이 `allowSelfNickname=false` 면 리더가 아닌 회원은 403.

### DELETE /api/groups/{groupId}/members/me
본인 탈퇴. **리더는 409**(먼저 다른 회원에게 리더 승계). 처리 내용:
`status=WITHDRAWN`·`left_at` 기록·직책은 MEMBER 로·개인 권한 삭제, 아직 시작하지 않은 일정의 신청 중·확정 참가를 본인 취소,
이 모임이 우선모임이면 해제. 차단이 아니므로 다시 가입 신청할 수 있다. 회원이 아니면 409.

### PATCH /api/groups/{groupId}/members/{userKey}/role
Body `{role: LEADER|MANAGER|MEMBER}`. **리더 전용**. `LEADER` 로 지정하면 리더 승계(기존 리더는 MANAGER).

### PUT /api/groups/{groupId}/members/{userKey}/permissions
Body `{presets: ["SCHEDULE_MANAGER", "ATTENDANCE_MANAGER"]}` — 전체 교체. **리더 전용**, 대상은 MANAGER 만.

### PATCH /api/groups/{groupId}/members/{userKey}/ban
내보내기·차단. Body `{reason}`(선택). **리더·매니저**, 대상은 role=MEMBER 만.
ACTIVE 면 `KICKED` 로 바꾸고, 이미 탈퇴(WITHDRAWN)한 회원이면 상태는 그대로 두고 재가입만 막는다.

### DELETE /api/groups/{groupId}/members/{userKey}/ban
차단 해제 — 행을 지우지 않고 `active=0` + 해제자·해제일 기록. `group_member.status` 는 바꾸지 않는다(재가입 승인 때만 ACTIVE).

---

## 알림 API

가입 승인·거부, 일정 승인·거부·변경·취소, 참가 승인·거부, 출석 처리 결과에서 생성된다(`NotificationService.createNotification`).
실시간 전송·폴링은 없다.

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/notifications?limit=` | 최근 N건(기본 20, 1~30) — `notificationId, sourceTable, sourceId, category, title, content, isRead, createdAt, groupId, targetUrl` |
| GET | `/api/notifications/unread-count` | `{count}` |
| PATCH | `/api/notifications/{notificationId}/read` | 단건 읽음(본인 것만, 멱등) |
| PATCH | `/api/notifications/read-all` | `{updated}` |

`groupId`/`targetUrl` 은 `source_table`+`source_id` 로 서버가 계산한다. 모임 생성 신청 알림은 둘 다 `null`.

---

## 지도·장소 API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/places?q=` | 장소 키워드 검색(카카오 로컬 프록시, 2~50자) — `[{name, address, roadAddress, latitude, longitude}]`. 카카오 앱의 카카오맵 서비스가 꺼져 있거나 실패하면 503 |
| GET | `/api/map/groups` | 활동 지역 좌표가 있는 모든 모임 — `[{groupId, name, regionName, latitude, longitude, memberCount, isMember}]` |
| GET | `/api/map/schedules?from=&to=` | 내가 활동 회원인 모임의 확정 일정 중 장소 좌표가 있는 것(epoch ms, 기본 지금부터 90일, 최대 1년) — `[{scheduleId, groupId, groupName, title, start, startAt, locationName, latitude, longitude}]` |

---

## 관리자 API

> **권한**: `ROLE_ADMIN` (`@PreAuthorize("hasRole('ADMIN')")`). 아니면 403.

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/admin/users?page=&size=&q=&role=&from=&to=` | 회원 — `q`: 닉네임·가입 경로, `role`: USER\|ADMIN, 기간: 가입일 |
| GET | `/api/admin/groups?page=&size=&q=&from=&to=` | 모임 — `q`: 모임명, 기간: 생성일 |
| GET | `/api/admin/group-requests?page=&size=&status=&q=&from=&to=` | 모임 생성 신청 — `status`: PENDING\|APPROVED\|REJECTED\|CANCELLED, `q`: 모임명, 기간: 신청일 |
| POST | `/api/admin/group-requests/{requestId}/approve` | 승인 → `{groupId}`(모임 생성). 처리 불가 409 |
| POST | `/api/admin/group-requests/{requestId}/reject` | Body `{rejectReason}`. 이미 처리됨 409 |
| GET | `/api/admin/group-joins?page=&size=&q=&from=&to=` | 대기 중 가입 요청 — `q`: 닉네임·모임명, 기간: 신청일 |
| POST | `/api/admin/group-joins/{requestId}/approve` | 모임 리더가 아니어도 처리 |
| POST | `/api/admin/group-joins/{requestId}/reject` | Body `{rejectReason}`(선택) |

목록은 모두 `PagingResponse<T>`. `from`/`to` 는 `yyyy-MM-dd`(양 끝 포함, 시작일 > 종료일이면 400).
`page` 를 주면 DB 페이징·필터, 없으면 전체를 메모리에서 자른다(하위 호환 — 기간·권한 필터는 적용되지 않음).
