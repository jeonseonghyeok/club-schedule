# club-schedule 프로젝트 로드맵

> 향후 작업 후보를 우선순위별로 정리한 참고 문서.
> 각 섹션은 독립적으로 요청 가능하다. 완료된 항목은 구현 후 이 문서에서 제거하거나 "완료" 표시로 옮긴다.
>
> **2026-07-10**: 아래 미구현/기술 부채 항목은 shrimp-task-manager에 task로 재구성되었고,
> 각 항목의 정책/스코프를 사용자와 확인해 확정했다(하단 "정책 확정" 표시). 실제 착수 시
> `list_tasks`로 task 상세(구현 가이드·검증 기준)를 참고한다.

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
| 출석(참가) 관리 — 백엔드 | 신청·취소·승인·거부·강제취소·출석체크 API 구현 ([API.md](API.md#출석-관리-api), 규칙: [DATABASE.md](DATABASE.md#출석-관리-규칙)) |
| 출석(참가) 관리 — 프론트 UI | `group.html` 일정 상세 모달에 참가 신청 버튼, 참가자 명단(호버/탭 팝오버), 참가자 관리 모달(승인/거부/출석체크) 구현 |
| 그룹 가입 요청·승인 | `POST/DELETE/GET .../join-requests`, `PATCH /groups/joins/{id}/approve\|reject` ([API.md](API.md#그룹-가입-요청-api)) |
| 그룹 정보 수정 | `PATCH /groups/{groupId}` — 이름·설명·정원·자동승인·일정정책 ([API.md](API.md#그룹-api)) |
| 일정 생성자 자동 참가 등록 | `GroupScheduleService.createSchedule/approveSchedule`에서 CONFIRMED 시점에 `scheduleAttendanceService.attend()` 자동 호출, `resolveInitialStatus`에서 생성자 본인은 항상 CONFIRMED (상세: [plans/schedule-creator-auto-attend.md](plans/schedule-creator-auto-attend.md)) |
| 모바일 캘린더 일자 모달 + 홈탭 스케줄 개선 | 캘린더 날짜 셀은 갯수 배지만 표시하고 클릭 시 일자별 목록 모달(+ "일정추가" 버튼)로 통일, 홈 탭 "스케줄" 위젯은 승인(CONFIRMED)된 일정만 표시하며 인원 현황·참가 신청/취소/재신청 버튼·승인 대기중 표시 추가 (상세: [plans/mobile-calendar-day-view-and-home-schedule.md](plans/mobile-calendar-day-view-and-home-schedule.md)) |

---

## 미구현 / 개선 필요 항목

### 우선순위 높음

#### 2. 참가 신청 승인 프로세스 — 알림 연동
- 상세 계획: [plans/attendance-approval-notifications.md](plans/attendance-approval-notifications.md)
- 그룹 가입/생성 신청과 달리 참가 신청 승인/거부 시 신청자에게 알림이 전혀 가지 않음

#### 10. 우선모임(즐겨찾기) 지정/변경/해제
- 상세 계획: [plans/favorite-group.md](plans/favorite-group.md)
- 사용자당 최대 1개 모임을 "우선모임"으로 지정. 모임 상세 탭 바 우측 별 버튼 토글 —
  미지정 시 등록, 다른 그룹이 지정돼 있으면 변경 확인 후 변경, 이미 지정된 그룹이면 해제

#### 11. 로그인/홈 접근 시 우선모임 자동이동
- 상세 계획: [plans/favorite-group-auto-redirect.md](plans/favorite-group-auto-redirect.md)
- 선행 조건: 10번(우선모임 지정 기능) 완료 후 착수
- 로그인 직후·주소창으로 홈(`/`) 직접 접근 시 우선모임이 있으면 해당 모임 상세로 자동이동,
  단 그룹 상세 화면의 "목록으로" 링크를 통한 이동은 자동이동 제외

---

### 우선순위 중간

#### 3. 그룹 권한 관리 UI (매니저 권한 설정)
- `group_member_permission` 테이블 + `GroupMemberPermissionMapper` 조회 로직 있음
- `group.html`에 `permissionsList` div 존재하지만 비어있음
- **필요 API:** `PUT /api/groups/{groupId}/members/{userKey}/permissions`
- **구현 위치:** `GroupApiController` 엔드포인트 추가, `group.html` permissionsList UI
- **정책 확정(2026-07-10):** 개별 permission 체크박스가 아닌 **프리셋 역할**(예: 일정관리자,
  출석관리자) 단위로 부여. 부여 주체는 LEADER로 제한.

---

### 우선순위 낮음

#### 4. 멤버 별명(닉네임) 수정
- `group_member` 테이블 별명 컬럼 없음, 스키마 마이그레이션 필요
- **정책 확정(2026-07-10):** **그룹별 닉네임**(전역 아님) — 그룹마다 다른 별명 표시,
  `group_member.nickname` 컬럼 추가

#### 5. 강퇴 목록(group_join_ban) 관리 UI
- `group_join_ban` 테이블 정의 완료, 관련 API·UI 없음
- **정책 확정(2026-07-10):** 조회 + 강퇴 해제(unban) 기능 포함

#### 6. 내 그룹 캘린더 (main.html 개선)
- 로그인 사용자가 속한 모든 그룹 일정 통합 뷰 필요
- **정책 확정(2026-07-10):** 이번 스프린트 **보류**. 재검토 시 그룹별 색상 구분 + 필터
  방향으로 논의 예정

#### 7. Swagger / OpenAPI 문서 자동화
- springdoc-openapi 의존성 추가
- **정책 확정(2026-07-10):** `/admin/**` 포함 **전체 API** 범위로 문서화

#### 8. 알림(Notification) 조회 및 읽음 처리
- `NotificationService.createNotification()`만 존재, 조회/읽음 API 없음
- **필요 API:**
  - `GET /api/notifications` — 내 알림 목록 (최신순)
  - `PATCH /api/notifications/{notificationId}/read` — 단건 읽음
  - `PATCH /api/notifications/read-all` — 전체 읽음
- **구현 위치:** `NotificationMapper` + XML, `NotificationService`, `NotificationApiController` (신규)
- DB: `notification` 테이블 이미 존재
- **정책 확정(2026-07-10):** 페이지네이션 없이 **최근 N건(20~30건) 단순 목록**. "참가 신청
  승인 프로세스 — 알림 연동"(위 2번) 완료 후에 SCHEDULE 알림도 함께 조회됨(하드 의존은 아님)

> **제거된 항목:** "일정 삭제 API" — 정책 확정(2026-07-10): CANCELLED 상태로 충분하며 별도
> 물리 삭제 API는 만들지 않기로 결정. 로드맵에서 제거.

---

## 기술 부채

| 항목 | 설명 | 정책 확정(2026-07-10) |
|------|------|------|
| `GroupRequestController` 승인/거부 403 | `hasRole('ROLE_ADMIN')`이 실제로는 `ROLE_ROLE_ADMIN`을 요구해 항상 실패 | 프론트는 별도의 `AdminApiController`(`/admin/api/group-requests/*`)를 호출 중임을 확인 — 죽은 코드이므로 **삭제** |
| `group.html` JS 압축 | 스크립트 블록이 CR-only 한 줄로 압축 → 파일 분리 고려 | 이번 스프린트 **보류** |
| `GroupApiController` 페이로드 파싱 | `Map<String,Object>` 직접 파싱 → 전용 Request DTO 교체 | 전체 일괄 교체 대신 **신규 엔드포인트부터 점진 적용** |
| 예외 처리 세분화 | `GlobalExceptionHandler` 범용 핸들러 → 세부 예외 추가 | **가입/출석 등 도메인 예외 우선** 적용 |
| 트랜잭션 동시성 | 일정 승인/취소 동시 요청 낙관적 락 미적용 | **참가 신청(schedule_attendance)까지 포함**해 적용 |

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
│   └── NotificationMapper.java + XML
└── vo/
    └── GroupScheduleVo.java

src/main/resources/templates/
└── group.html   (script 블록 CR-only endings → PowerShell 전용)
```
