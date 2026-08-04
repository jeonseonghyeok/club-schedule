# club-schedule 프로젝트 로드맵

> 향후 작업 후보를 우선순위별로 정리한 참고 문서.
> 각 섹션은 독립적으로 요청 가능하다. 완료된 항목은 구현 후 이 문서에서 제거하거나 "완료" 표시로 옮긴다.
>
> **2026-07-10**: 아래 미구현/기술 부채 항목은 shrimp-task-manager에 task로 재구성되었고,
> 각 항목의 정책/스코프를 사용자와 확인해 확정했다(하단 "정책 확정" 표시). 실제 착수 시
> `list_tasks`로 task 상세(구현 가이드·검증 기준)를 참고한다.
>
> **2026-08-04**: [requirements-analysis.md](requirements-analysis.md)(일반사용자/모임매니저/
> 모임리더/관리자/개발자 5개 관점 감사)에서 발견한 교차 이슈·findings를 스키마 변경 없는
> 범위(Phase 0/1/2/5)까지 구현했다. 스키마 변경이 필요한 항목(감사로그 컬럼, 그룹 삭제/
> 비활성화 등, requirements-analysis.md 교차이슈 6·7)은 아직 미착수로 남아 있다.

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
| `PATCH /groups/{groupId}` 권한 체크 버그 수정 | 존재하지 않는 메서드 `isLeaderOrSubLeader`를 참조해 항상 예외가 나던 것을 `GroupManageService.isManager`로 교체(그룹 기본정보 수정 가능 범위가 리더 전용에서 매니저까지 확대됨) |
| `GroupRequestController` 죽은 코드 삭제 | `hasRole('ROLE_ADMIN')`(실제로는 `ROLE_ROLE_ADMIN`을 요구해 항상 거부)로 막혀있던 승인/거부 엔드포인트와 대응 테스트 삭제. `AdminApiController`의 `/admin/api/group-requests/*`는 그대로 유지 |
| 역할 승격/강등 API | `GroupManageService.changeRole` — `PATCH /api/groups/{groupId}/members/{userKey}/role`(리더 전용). LEADER로 승격 시 기존 리더는 자동으로 MANAGER 강등, `group.leader_user_key`와 `group_member.role`을 한 트랜잭션에서 동기화(그룹당 LEADER는 항상 정확히 1명 — 사실상 "리더 승계" 기능을 겸함) |
| 그룹 권한 관리 UI (매니저 권한 설정) | `GroupPermissionService.PermissionPreset`(SCHEDULE_MANAGER=일정관리자, ATTENDANCE_MANAGER=출석관리자) 프리셋 신설, `PUT /api/groups/{groupId}/members/{userKey}/permissions`(리더 전용, 대상은 role=MANAGER만)로 부여/회수. 정책 확정(2026-07-10)대로 개별 체크박스가 아닌 프리셋 단위 부여. 출석 승인/거부/체크인(`ScheduleAttendanceService`)이 기존엔 override를 전혀 참조하지 않고 `role != MEMBER`만 확인해 "출석관리자" 프리셋이 무의미했던 것을, `GroupPermissionService.canManageSchedule`(override 우선 → 그룹정책 기본값)을 함께 쓰도록 확장해 실질적 효과를 갖도록 함. `group.html` `permissionsList`(그동안 빈 껍데기)에 프리셋 체크박스 UI 구현 |
| 일정 변경/취소 알림 | `GroupScheduleService.editSchedule`/`cancelSchedule`이 참가 확정(CONFIRMED) 멤버에게 알림 발송(작업자 본인 제외, 기존 `SCHEDULE`/`NOTICE` 값 재사용). 강퇴/차단 알림과 카테고리 세분화는 `notification.source_table`/`category`가 SQL ENUM이라 스키마 변경 없이는 불가해 보류(`group_join_ban`은 복합키뿐이라 적합한 `source_id`도 없음) |
| PENDING 일정 매니저 수정 허용 | `GroupPermissionService.validateEditPermission` — 기존엔 PENDING 일정을 작성자만 고칠 수 있어 오탈자 하나도 반려 후 재작성을 강제했음. 이제 리더/MANAGE_SCHEDULE 권한 매니저도 CONFIRMED와 동일하게 PENDING 일정을 바로 수정 가능 |
| 참석 체크인 일괄처리/부분실패 개선 | "전체 참석" 옆에 "전체 불참" 버튼 추가. 저장 로직을 `Promise.all`→`Promise.allSettled`로 바꿔, 일부만 실패해도 실패한 인원 이름을 정확히 알려주고 이미 성공한 변경은 그대로 반영(재시도 시 성공분 자동 제외) |
| 관리자 가입요청 승인/거부 | `AdminApiController`에 `POST /admin/api/group-joins/{id}/approve\|reject` 신설(기존엔 조회만 가능해 관리자가 직접 개입할 수단이 없었음). `/admin/api/group-joins`는 `page` 파라미터 시 DB 레벨 페이징+닉네임/그룹명 검색으로 전환(`users`/`groups`와 동일 패턴), 관리자 패널(`admin-renderer.js`)에 승인/거부 버튼 UI 추가 |
| 내 참가 이력 조회 | `GET /api/groups/{groupId}/attendance/me` 신설(그룹 내 본인의 일정별 최신 참가 상태, 최신순) + `group.html`에 "내 참가 이력" 버튼/모달. 기존엔 매니저용 "이력보기"만 있고 일반 멤버가 스스로 조회할 화면이 없었음 |
| 즐겨찾기 그룹 목록 반영 | 우선모임(★) 지정은 있었지만 "내 모임" 목록에 전혀 반영되지 않던 것을, 즐겨찾기 그룹을 최상단 정렬 + ★ 표시로 개선(`MainController`가 `favoriteGroupId`를 `list=1` 우회 시에도 항상 모델에 노출하도록 변경) |
| 예외 메시지 정보노출 수정 | `GlobalExceptionHandler`의 catch-all(`Exception.class`)이 `ex.getMessage()`를 그대로 클라이언트에 반환하던 것을, 서버 로그(`log.error`)에만 원본을 남기고 클라이언트에는 일반화된 메시지를 반환하도록 수정 |

---

## 미구현 / 개선 필요 항목

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
