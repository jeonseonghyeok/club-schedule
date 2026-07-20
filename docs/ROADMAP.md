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
| 참가·참석 관리 — 백엔드 | 신청·취소·승인·거부·강제취소·참석체크 API 구현 ([API.md](API.md#참석-관리-api), 규칙: [DATABASE.md](DATABASE.md#참가-관리-규칙)) |
| 참가·참석 관리 — 프론트 UI | `group.html` 일정 상세 모달에 참가 신청 버튼, 참가자 명단(호버/탭 팝오버), 참가자 관리 모달(승인/거부/참석확인) 구현 |
| 그룹 가입 요청·승인 | `POST/DELETE/GET .../join-requests`, `PATCH /groups/joins/{id}/approve\|reject` ([API.md](API.md#그룹-가입-요청-api)) |
| 그룹 정보 수정 | `PATCH /groups/{groupId}` — 이름·설명·정원·자동승인·일정정책 ([API.md](API.md#그룹-api)) |
| 일정 생성자 자동 참가 등록 | `GroupScheduleService.createSchedule/approveSchedule`에서 CONFIRMED 시점에 `scheduleAttendanceService.attend()` 자동 호출, `resolveInitialStatus`에서 생성자 본인은 항상 CONFIRMED (상세: [plans/schedule-creator-auto-attend.md](plans/schedule-creator-auto-attend.md)) |
| 모바일 캘린더 일자 모달 + 홈탭 스케줄 개선 | 캘린더 날짜 셀은 갯수 배지만 표시하고 클릭 시 일자별 목록 모달(+ "일정추가" 버튼)로 통일, 홈 탭 "스케줄" 위젯은 승인(CONFIRMED)된 일정만 표시하며 인원 현황·참가 신청/취소/재신청 버튼·승인 대기중 표시 추가 (상세: [plans/mobile-calendar-day-view-and-home-schedule.md](plans/mobile-calendar-day-view-and-home-schedule.md)) |
| 우선모임(즐겨찾기) 지정/변경/해제 | `user.favorite_group_id` 컬럼(migration_v5) 추가, `PUT`/`DELETE /groups/{groupId}/favorite` API, 모임 상세 탭 바 별 버튼(등록/변경확인/해체) (상세: [plans/favorite-group.md](plans/favorite-group.md)) |
| 로그인/홈 접근 시 우선모임 자동이동 | `MainController.main()`이 userKey 확정 후 공통 꼬리 로직에서 `favoriteGroupId` 있으면 `/groups/{id}`로 리다이렉트(`list=1` 파라미터 있으면 제외), `group.html` "목록으로" 링크는 `/?list=1`로 이동해 자동이동 우회 (상세: [plans/favorite-group-auto-redirect.md](plans/favorite-group-auto-redirect.md)) |
| 관리 탭 개편 + 강퇴 목록(group_join_ban) 관리 UI | 관리 탭 상단에 "가입 요청"·"일정 승인요청"(PENDING만) 위젯 배치, 회원관리는 별도 페이지가 아닌 관리 탭 내 인라인 상태 필터(일반회원/탈퇴회원/내보내기 탭)로 구현. `group_join_ban` 매퍼/서비스 신규 구현으로 벤 처리·해제 API(`PATCH`/`DELETE /api/groups/{groupId}/members/{userKey}/ban`) 추가, 강퇴(KICKED) 시 재가입 자동 차단·자진탈퇴(WITHDRAWN) 후 별도 벤 처리 가능. 내보내기 대상은 `role=MEMBER`로 제한(리더는 절대 대상 불가, 매니저끼리도 서로 내보낼 수 없음 — 백엔드/프론트 모두 강제). 벤 해제는 `group_join_ban` 행을 삭제 대신 `active=0` 비활성화 + `unbanned_at`/`unbanned_by_user_key` 기록으로 바꿔 벤/해제 이력을 보존하며, `group_member.status`는 벤 해제로 자동 변경되지 않음(재가입 승인 시점에만 ACTIVE로 전환, migration_v7). 재가입 승인 시 `group_member` 기존 행을 재활성화(UPDATE)하도록 고쳐 PK 충돌 버그 해소(`group_join_request`는 확인 결과 UNIQUE 제약이 처음부터 없어 재신청 자체는 원래도 가능했음 — 조회 성능용 인덱스만 migration_v6으로 추가) |
| 개인 알림 센터 | 가입 승인/거부에만 붙어있던 알림 생성을 일정 신청 승인/거부(`GroupScheduleService`)·일정참가 신청 승인/거부·출석처리 결과(`ScheduleAttendanceService`)까지 확장(모두 `sourceTable=SCHEDULE` 재사용, 출석처리는 결정이 아닌 결과 통보라 `category=NOTICE`로 구분). `NotificationMapper`/`NotificationService`에 목록 조회·안읽음 카운트·읽음처리 메서드 추가(`GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` — 신규 `NotificationApiController`), 목록 조회 시 `source_table` 기준 LEFT JOIN으로 `groupId`/`targetUrl`을 서버에서 resolve. 프론트는 `fragments.html`에 벨+배지+드롭다운 프래그먼트(`notifBell`)를 신설해 main.html/group.html/admin_main.html 3개 헤더에 공통 삽입, `static/js/notifications.js` 신규(폴링 없이 로드/드롭다운 오픈 시점 fetch, 클릭 시 읽음처리+이동). v1 범위: 최근 20~30건 단순 목록(페이지네이션 없음), 클릭 시 그룹 페이지까지만 이동(일정 상세 모달 딥링크는 후속 과제). `notification` 테이블에 `(user_key,created_at)` 조회 인덱스 추가(migration_v8) |

---

## 미구현 / 개선 필요 항목

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

#### 6. 내 그룹 캘린더 (main.html 개선)
- 로그인 사용자가 속한 모든 그룹 일정 통합 뷰 필요
- **정책 확정(2026-07-10):** 이번 스프린트 **보류**. 재검토 시 그룹별 색상 구분 + 필터
  방향으로 논의 예정

#### 7. Swagger / OpenAPI 문서 자동화
- springdoc-openapi 의존성 추가
- **정책 확정(2026-07-10):** `/admin/**` 포함 **전체 API** 범위로 문서화

#### 9. 본인 탈퇴(자진 탈퇴) API
- 현재 `group_member.status`를 `WITHDRAWN`으로 바꾸는 API가 전혀 없음(관리자의 강퇴만
  존재, `GroupManageService.banMember`). 회원 본인이 스스로 탈퇴하는 기능은 관리 탭 개편
  작업(가입요청/일정승인요청 위젯, 회원관리 페이지 분리, 벤 처리/해제) 범위 밖이라 별도
  항목으로 분리해둔다.

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
│   ├── GroupViewController.java
│   └── NotificationApiController.java
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
