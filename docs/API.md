# Club Schedule API 문서

이 문서는 현재 프로젝트에 추가되었거나 수정된 주요 API(관리자 페이지, 그룹 멤버/일정 관련)를 한국어로 정리한 문서입니다.

목차
- 공통 규약
- 페이징 응답 형식: `PagingResponse<T>`
- 관리자(Admin) API
  - GET /admin/api/users
  - GET /admin/api/groups
  - GET /admin/api/group-joins
- 그룹(Group) API
  - GET /api/groups/{groupId}/schedules
  - POST /api/groups/{groupId}/schedules
  - GET /api/groups/{groupId}/members
  - PATCH /api/groups/{groupId}/members/{userKey}/ban
- 예제 요청/응답 (curl 및 JSON)
- 에러/상태 코드 정리
- 보안/권한 관련 주의사항
- 권장 향후 개선사항

---

## 공통 규약
- 모든 JSON 요청/응답은 `application/json`을 사용합니다.
- 타임스탬프 형식(일정의 `start` 등)은 epoch milliseconds (Number)을 사용합니다.
- 인증/권한은 스프링 시큐리티를 사용합니다. 각 엔드포인트 아래에 권한 요구사항을 명시합니다.

---

## 페이징 응답 형식: `PagingResponse<T>`
서버에서 페이징 처리된 결과를 반환할 때 사용되는 공통 응답 객체입니다.

필드 요약
- `totalCount` (Number): 전체 레코드 수
- `currentPage` (Integer): 현재 페이지 (1 기반)
- `size` (Integer): 페이지당 항목 수
- `totalPages` (Integer): 총 페이지 수 = ceil(totalCount / size)
- `startPage` (Integer): 페이징 블록의 시작 페이지 (예: 블록 사이즈 5일 때 1,6,11...)
- `endPage` (Integer): 페이징 블록의 끝 페이지
- `items` (Array<T>): 현재 페이지의 데이터 배열

예시
```json
{
  "totalCount": 123,
  "currentPage": 2,
  "size": 25,
  "totalPages": 5,
  "startPage": 1,
  "endPage": 5,
  "items": [ /* 데이터 항목 */ ]
}
```

비고: 기본 블록 사이즈는 5이며, 프론트엔드와 백엔드에서 동일한 규칙을 사용합니다.

---

## 관리자 API (관리자 권한 필요)
관리자 전용 API는 `@PreAuthorize("hasRole('ADMIN')")`로 보호됩니다. ADMIN 권한이 없는 요청은 403을 반환합니다.

### GET /admin/api/users
- 설명: 회원 목록 조회 (검색 및 페이징 지원)
- 권한: ADMIN
- 쿼리 파라미터:
  - `page` (optional): 페이지 번호(1 기반). 존재 시 DB-level 페이징 사용.
  - `size` (optional): 페이지 사이즈(기본 25)
  - `q` (optional): 검색 키워드
- 응답: `PagingResponse<UserVo>`
- 예시: `/admin/api/users?page=1&size=20&q=홍길동`

### GET /admin/api/groups
- 설명: 그룹 목록 조회 (검색 및 페이징 지원)
- 권한: ADMIN
- 파라미터: `page`, `size`, `q` (users와 동일)
- 응답: `PagingResponse<GroupVo>`

### GET /admin/api/group-joins
- 설명: 가입 요청(모니터링) 조회
- 권한: ADMIN
- 파라미터: `page`, `size`, `q` (현재는 in-memory 페이징 fallback)
- 응답: `PagingResponse<GroupJoinRequestVo>`

비고: `page`가 제공되면 서버는 DB-level 페이징(예: MyBatis LIMIT/OFFSET + COUNT)을 사용해 `PagingResponse`를 구성합니다. `page`가 없으면 기존 방식으로 전체 목록을 불러와 서버에서 필터 및 슬라이스를 수행합니다(하위 호환성 유지 목적).

---

## 그룹(Group) API
일반 그룹 관련 엔드포인트입니다. 일부는 인증이 필요합니다.

### GET /api/groups/{groupId}/schedules
- 설명: 그룹의 일정 목록 조회
- 권한: 공개(현재는 인증 없이도 조회 가능)
- 경로 파라미터:
  - `groupId` (Long)
- 응답: 배열 of 이벤트 객체

응답 이벤트 객체 필드
- `id` (Number): 이벤트 ID
- `title` (String)
- `start` (Number): epoch milliseconds
- `createdBy` (Number, optional): 생성자 userKey

예시 응답
```json
[
  { "id": 101, "title": "정기 모임", "start": 1710806400000, "createdBy": 12 },
  { "id": 102, "title": "스터디", "start": 1710892800000, "createdBy": 34 }
]
```

### POST /api/groups/{groupId}/schedules
- 설명: 그룹 일정 생성
- 권한: 인증된 사용자(로그인 필요). 현재는 단순 인증 체크만 수행.
- 경로 파라미터: `groupId` (Long)
- 요청 바디 (JSON) 형식:
```json
{
  "title": "스터디 모임",
  "start": 1710806400000
}
```
- 필수 필드: `title`, `start`
- 응답(성공): 생성된 이벤트 객체(200 OK)
```json
{ "id": 1000, "title": "스터디 모임", "start": 1710806400000, "createdBy": 12 }
```
- 에러:
  - 400 Bad Request: `title` 또는 `start`가 없을 때 (메시지: "title and start are required")
  - 401 Unauthorized: 인증 필요

비고: 현재 이벤트는 메모리 저장소(`ConcurrentHashMap`)에 보관되며 서버 재시작 시 초기화됩니다. 영속화(데이터베이스) 추가 권장.

### GET /api/groups/{groupId}/members
- 설명: 그룹 멤버 목록 조회
- 권한: 공개(현재는 인증 없이도 조회 가능)
- 응답 예시
```json
[
  { "userKey": 12, "displayName": "user01", "role": "MEMBER", "status": "ACTIVE", "joinedAt": "2025-01-01T12:00:00" },
  ...
]
```

### PATCH /api/groups/{groupId}/members/{userKey}/ban
- 설명: 멤버 차단(관리자 또는 리더 권한이 내부적으로 검증될 수 있음)
- 권한: 인증 필요
- 응답: 200 OK(성공), 401(미인증), 403(권한 없음)

---

## 예제 요청/응답 (curl)
- 일정 목록 조회
```bash
curl -X GET "http://localhost:8080/api/groups/42/schedules" -H "Accept: application/json"
```

- 일정 생성 (예: 토큰 방식)
```bash
curl -X POST "http://localhost:8080/api/groups/42/schedules" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"스터디 모임","start":1710806400000}'
```

- 관리자에서 사용자 페이징 조회
```bash
curl -X GET "http://localhost:8080/admin/api/users?page=2&size=25&q=홍길동" -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 에러/상태 코드 정리
- 200 OK: 정상 응답
- 400 Bad Request: 입력 값 불충분 또는 형식 오류
- 401 Unauthorized: 인증 필요 (로그인 등)
- 403 Forbidden: 권한 부족 (ADMIN 권한 등)
- 500 Internal Server Error: 서버 예외

---

## 보안/권한 관련 주의사항
- 현재 Admin API는 `@PreAuthorize("hasRole('ADMIN')")`로 보호됩니다. 실제 운영에서는 세션/토큰 만료, CSRF, CORS 정책 등을 함께 검토하세요.
- 일정 생성은 현재 "로그인만 하면 가능"한 상태입니다. 필요 시 "그룹 멤버만 생성 가능" 또는 "리더만 생성 가능" 같은 권한 규칙을 서버에서 검증해야 합니다.

---

## 권장 향후 개선사항
1. 일정 영속화: `schedule` 테이블(스키마 설계) + 매퍼(XML) + `ScheduleService` 구현. 현재 인메모리는 데모/프로토타입 용도입니다.
2. 권한 강화: 그룹 소속 여부/리더 여부에 따른 권한 체크 구현.
3. 일정 편집/삭제 API 제공: PUT/PATCH/DELETE `/api/groups/{groupId}/schedules/{scheduleId}`
4. OpenAPI(Swagger) 문서 자동화: `springdoc-openapi` 등을 통해 스펙 자동 생성.
5. 프론트엔드 개선: FullCalendar 같은 검증된 라이브러리 도입 고려.

---

문서 생성을 완료했습니다. 원하시면 이 파일을 커밋 메시지와 함께 커밋해드리거나, OpenAPI 스펙으로 변환해 드릴게요.