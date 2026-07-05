# club-schedule 프로젝트 로드맵

> 향후 작업 후보를 우선순위별로 정리한 참고 문서.
> 각 섹션은 독립적으로 요청 가능하다. 완료된 항목은 구현 후 이 문서에서 제거하거나 "완료" 표시로 옮긴다.

---

## 완료된 항목

| 항목 | 내용 |
|------|------|
| 일정 수정 모달 | `openEditModal` — commonModal 패턴, 변경사유 필수 |
| 승인 로딩바 | `performAction` — 버튼 비활성화 + "처리 중..." + 완료 메시지 |
| 거부/취소 확인 | `confirmAndAct` — 경고 문구 + 사유 textarea 필수 |
| 필터 드랍박스 | 승인/대기/거부/취소/전체 select |
| 일정 상세보기 | 종료시간·장소·정원 표시, 승인→복제 버튼 |
| 캘린더 날짜 버그 | `toISOString()`→`_dk()` 로컬 기준으로 교체 (UTC+9 오프셋 해소) |
| 종료시간 미저장 | create payload에 `end: endEpoch` 추가 |
| 복제 UX | 제목·내용·장소·정원 복사, 시작/종료 시간 비우기 |
| maxInput 기본값 | `'10'`으로 설정 |
| fetchSchedulesRaw | `end`, `locationName`, `maxAttendance` 필드 매핑 추가 |
| 일정 정책 초기화 | 그룹 생성 시 `insertDefaultPolicy` 호출 |
| displayName | `GroupMemberMapper.xml` JOIN 쿼리 |
| 관리자 모임 생성 신청 관리 | `GET/POST /admin/api/group-requests` + 승인/거부 UI ([API.md](API.md#관리자-api)) |
| 메인화면 모임 검색 | `GET /groups/recommended?q=` + 검색 UI ([API.md](API.md#그룹-api)) |
| 일정 수정/승인/반려/취소 API | `PATCH /api/groups/{groupId}/schedules/{scheduleId}[/approve\|/reject\|/cancel]` ([API.md](API.md#그룹-일정-api)) |
| 참가 신청 관리 — 백엔드 | 신청·취소·승인·거부·강제취소 API 구현 ([API.md](API.md#출석-관리-api), 규칙: [DATABASE.md](DATABASE.md#출석-관리-규칙)). **출석 체크(실제 참석 확인)와는 별개 개념** — 아래 참고. **`group.html`에 참가 버튼·참가자 목록 UI는 아직 없음** — 아래 미구현 항목 참고 |
| 그룹 가입 요청·승인 | `POST/DELETE/GET .../join-requests`, `PATCH /groups/joins/{id}/approve\|reject` ([API.md](API.md#그룹-가입-요청-api)) |
| 그룹 정보 수정 | `PATCH /groups/{groupId}` — 이름·설명·정원·자동승인·일정정책 ([API.md](API.md#그룹-api)) |
| `ScheduleAttendanceApiController` 500 위험 수정 | 모든 `@PathVariable`에 이름 명시 ([기술 부채](#기술-부채)에서 제거) |
| 출석 체크 정정 권한 통일 + 변경 이력 | `checkActual()` 권한을 `validateAttendanceManagerPermission()`(일정 생성자 또는 MANAGER 이상)으로 통일, 매 체크마다 `schedule_attendance_check_history`에 변경 전/후 값 기록 ([API.md](API.md#출석-관리-api), 스키마: [DATABASE.md](DATABASE.md#출석-체크-정정-이력)). 부수 수정: `updateActualStatus`에서 누락됐던 `checked_at` 미갱신, `selectActiveList`의 존재하지 않는 컬럼(`u.name`) 참조 SQL 오류도 함께 수정 |

---

## 미구현 / 개선 필요 항목

### 우선순위 높음

> **참가 신청**(attend/cancel/approve/reject/forceCancel)과 **출석 관리**(실제 참석 여부 체크, `actual_status`)는 서로 다른 개념이다. 전자는 "일정에 갈지 말지 신청·승인하는 절차", 후자는 "일정이 끝난 뒤 실제로 왔는지 확인·기록하는 절차"다. 혼동해서 설계하지 말 것.

#### 1. 출석(참가) 관리 — 프론트 UI
- 백엔드 API는 완료([API.md](API.md#출석-관리-api)) — 남은 건 프론트뿐
- `group.html` 일정 상세보기에 참가 신청 버튼, 참가자 목록, 승인/거부 UI 추가
- 출석 체크 UI는 정정 권한·이력 설계가 완료된 상태([완료된 항목](#완료된-항목) 참고)이므로 바로 붙이면 됨 — 정정 시 `changeReason`을 입력받아 `PATCH .../check` 바디에 함께 전달할 것

---

### 우선순위 중간

#### 2. 그룹 권한 관리 UI (매니저 권한 설정)
- `group_member_permission` 테이블 + `GroupMemberPermissionMapper` 조회 로직 있음
- `group.html`에 `permissionsList` div 존재하지만 비어있음
- **필요 API:** `PUT /api/groups/{groupId}/members/{userKey}/permissions`
- **구현 위치:** `GroupApiController` 엔드포인트 추가, `group.html` permissionsList UI

---

### 우선순위 낮음

#### 3. 일정 삭제 API
- 삭제 vs 취소(CANCELLED) 정책 결정 필요
- 관련 파일: `GroupScheduleService`, `GroupScheduleMapper`

#### 4. 멤버 별명(닉네임) 수정
- `group_member` 테이블 별명 컬럼 없음, 정책 재검토 필요

#### 5. 강퇴 목록(group_join_ban) 관리 UI
- `group_join_ban` 테이블 정의 완료, 관련 API·UI 없음

#### 6. 내 그룹 캘린더 (main.html 개선)
- 로그인 사용자가 속한 모든 그룹 일정 통합 뷰 필요

#### 7. Swagger / OpenAPI 문서 자동화
- springdoc-openapi 의존성 추가

#### 8. 알림(Notification) 조회 및 읽음 처리
- `NotificationService.createNotification()`만 존재, 조회/읽음 API 없음
- **필요 API:**
  - `GET /api/notifications` — 내 알림 목록 (최신순)
  - `PATCH /api/notifications/{notificationId}/read` — 단건 읽음
  - `PATCH /api/notifications/read-all` — 전체 읽음
- **구현 위치:** `NotificationMapper` + XML, `NotificationService`, `NotificationApiController` (신규)
- DB: `notification` 테이블 이미 존재

---

## 기술 부채

| 항목 | 설명 |
|------|------|
| `GroupRequestController` 승인/거부 403 | `hasRole('ROLE_ADMIN')`이 실제로는 `ROLE_ROLE_ADMIN`을 요구해 항상 실패. 어디서도 호출하지 않는 죽은 코드 — 삭제하거나 `hasRole('ADMIN')`으로 수정 필요 |
| `group.html` JS 압축 | 스크립트 블록이 CR-only 한 줄로 압축 → 파일 분리 고려 |
| `GroupApiController` 페이로드 파싱 | `Map<String,Object>` 직접 파싱 → 전용 Request DTO 교체 |
| 예외 처리 세분화 | `GlobalExceptionHandler` 범용 핸들러 → 세부 예외 추가 |
| 트랜잭션 동시성 | 일정 승인/취소 동시 요청 낙관적 락 미적용 |

---

## 파일 위치 참고

```
src/main/java/com/moyora/clubschedule/
├── controller/
│   ├── GroupApiController.java
│   └── GroupViewController.java
├── service/
│   ├── GroupScheduleService.java
│   ├── GroupPermissionService.java
│   └── NotificationService.java
├── mapper/
│   ├── GroupScheduleMapper.java + XML
│   ├── ScheduleAttendanceMapper.java + XML
│   ├── ScheduleAttendanceCheckHistoryMapper.java + XML
│   └── NotificationMapper.java + XML
└── vo/
    └── GroupScheduleVo.java

src/main/resources/templates/
└── group.html   (script 블록 CR-only endings → PowerShell 전용)
```
