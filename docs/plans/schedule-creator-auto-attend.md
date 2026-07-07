# 일정 생성자 자동 참가 등록

## 배경
club-schedule 프로젝트(Spring Boot + MyBatis)에서 그룹 일정(GroupSchedule)과
참가 신청(ScheduleAttendance)은 완전히 분리된 시스템으로 구현되어 있다.
현재는 일정을 생성한 사람(신청자)이 자신이 만든 일정에 참가자로 자동 등록되지
않으며, 별도로 "참가 신청" 버튼을 눌러야만 참가자 명단에 들어간다.
이 기능을 추가해, 일정 생성자가 자신의 일정에 대해 자동으로 참가 등록되도록 한다.

## 현재 코드 구조 (조사 완료, 참고용)
- 일정 생성: `GroupApiController.createSchedule()` (POST /api/groups/{groupId}/schedules)
  → `GroupScheduleService.createSchedule(dto)` (GroupScheduleService.java:93-101)
  - 초기 status는 `GroupPermissionService.resolveCreatePermission(groupId, createdBy)`가
    결정 (GroupPermissionService.java:92-112). LEADER/특정 MANAGER는 즉시 CONFIRMED,
    그 외에는 그룹 정책(requiresApproval)에 따라 PENDING 또는 CONFIRMED.
- 일정 승인: `GroupApiController` → `GroupScheduleService.approveSchedule()`
  (GroupScheduleService.java:109-117), PENDING→CONFIRMED 전환은 정확히
  `groupScheduleMapper.updateScheduleStatus(scheduleId, CONFIRMED, operatorUserKey)`
  한 줄(115행)에서 일어난다. 이 메서드는 이미 `@Transactional`이 걸려 있다.
- 참가 신청: `ScheduleAttendanceService.attend()` (39-68행)
  - **일정 상태가 CONFIRMED가 아니면 예외를 던진다** (43-45행) → PENDING 일정에는
    애초에 참가 신청이 불가능하도록 설계되어 있다.
  - 초기 참가 status는 `resolveInitialStatus(groupId, scheduleId, userKey)`
    (216-232행, 현재 `private`)가 결정: LEADER/MANAGER는 무조건 CONFIRMED,
    MEMBER는 그룹 정책(`requires_attendance_approval`)에 따라 PENDING/CONFIRMED.
    **`scheduleId` 파라미터는 현재 메서드 본문에서 전혀 쓰이지 않는 죽은 인자다**
    (일정 생성자 여부를 판단하지 않기 때문) — 이번 작업에서 실제로 쓰기 시작한다.
  - `attend()`는 41행에서 이미 `GroupScheduleVo schedule = requireSchedule(...)`로
    일정 전체를 조회해 갖고 있으므로, `resolveInitialStatus`에 `scheduleId` 대신
    이 `schedule` 객체(또는 `schedule.getCreatedBy()`)를 넘기도록 시그니처를 바꾸면
    재조회 없이 생성자 여부를 판단할 수 있다.
  - `insertAttendance` 필수 필드: scheduleId, userKey, status, actualStatus(NONE),
    updatedBy(신청 본인과 동일값). `is_latest`는 INSERT SQL에서 항상 1로 고정됨
    (ScheduleAttendanceMapper.xml:57-62).
  - 참가자 목록 조회 API(`GET .../attendance`)는 이 테이블을 그대로 읽으므로,
    자동 등록도 이 테이블에 정상적으로 행을 넣으면 기존 UI(참가자 명단,
    인원/정원 카운트 등)에 별도 수정 없이 그대로 반영된다.

## 요구사항
1. 일정이 **CONFIRMED 상태가 되는 시점**(둘 중 하나)에 일정 생성자(createdBy)를
   자동으로 참가자로 등록한다.
   - (a) 생성 즉시 CONFIRMED인 경우 → `GroupScheduleService.createSchedule()` 내부
   - (b) PENDING으로 생성된 뒤 나중에 승인되어 CONFIRMED가 되는 경우 →
     `GroupScheduleService.approveSchedule()` 내부
   - **두 지점 모두 훅이 필요하다** — 한쪽만 처리하면 정책상 흔한 "승인 필요" 케이스에서
     생성자가 자동 등록되지 않는 누락이 생긴다.
2. 등록되는 참가 status는 **항상 CONFIRMED**여야 한다. 단, 이를 별도의 하드코딩된
   분기로 만들지 않고 **`resolveInitialStatus` 자체를 확장**해서 처리한다(사용자
   요청에 따른 방향 전환 — [attendance-approval-notifications.md](attendance-approval-notifications.md)와
   함께 검토하면서 결정):
   ```java
   private AttendanceStatus resolveInitialStatus(Long groupId, GroupScheduleVo schedule, Long userKey) {
       if (userKey.equals(schedule.getCreatedBy())) {
           return AttendanceStatus.CONFIRMED;   // 일정 신청자(생성자) 본인은 항상 자동승인
       }
       String roleStr = memberMapper.selectRoleByGroupAndUser(groupId, userKey);
       GroupRole role = ...;
       if (role == GroupRole.LEADER || role == GroupRole.MANAGER) {
           return AttendanceStatus.CONFIRMED;   // 기존 로직 그대로
       }
       ...
   }
   ```
   - 이렇게 하면 **일정 생성자가 직접 "참가 신청" 버튼을 눌러 `attend()`를 타는 경우**와
     **이 계획의 자동 등록 훅(아래 요구사항 1)이 대신 호출하는 경우** 모두 동일한
     하나의 규칙으로 CONFIRMED가 보장된다 — 별도의 특수 케이스 메서드를 새로 만들
     필요가 없다.
   - 자동 등록 훅(createSchedule/approveSchedule 내부)에서도 새 `registerCreatorAsAttendee`
     메서드를 만들되, 내부적으로는 이 확장된 `resolveInitialStatus`를 그대로 호출해서
     status를 결정한다(로직 중복 금지).
   - `resolveInitialStatus`는 여전히 `private`으로 두되, 시그니처의 `scheduleId` 인자를
     `GroupScheduleVo schedule`로 바꿔 생성자 여부를 판단할 수 있게 한다.
3. 이미 참가 이력이 있는 경우(재승인 등 예외적 상황) 중복 INSERT가 나지 않도록
   `attend()`의 기존 관례(`selectLatest`로 확인 후 없을 때만 insert, 있으면 skip 또는
   기존 로직 재사용)를 따른다. 단, 일반적인 생성/승인 흐름에서는 스케줄이 방금 막
   생성/승인된 시점이라 참가 이력이 없는 것이 정상이므로 과도하게 방어적인 코드는
   지양한다.
4. 트랜잭션 경계: `approveSchedule()`은 이미 `@Transactional`이므로 그 안에서
   attendance insert를 호출하면 원자성이 보장된다. `createSchedule()`에도
   `@Transactional`이 없다면 추가해서 일정 생성과 참가 등록이 한 트랜잭션에서
   처리되도록 한다.
5. REJECTED/CANCELLED로 가는 경로(rejectSchedule, cancelSchedule)는 참가 등록과
   무관하므로 건드리지 않는다.

## 명시적으로 다루지 않아도 되는 것 (스코프 아님)
- 정원(max_attendance) 초과 검증: 현재 `attend()`에도 없는 기존 공백이며, 이 작업의
  범위가 아니다. 생성자 자동 등록 시에도 정원 체크를 새로 추가하지 않는다.
- 프론트엔드(group.html) 수정: 참가자 목록/인원 카운트는 이미 attendance 테이블을
  그대로 읽으므로, 백엔드에서 정상적으로 행을 insert하면 프론트는 수정 없이 그대로
  동작해야 한다. 실제로 그런지 검증 단계에서 확인만 한다.

## 검증 방법
1. LEADER 계정으로 일정 생성 → 즉시 CONFIRMED로 만들어지는지, 그리고 생성자가
   바로 참가자 목록(`GET /api/groups/{groupId}/schedules/{id}/attendance`)에
   CONFIRMED 상태로 나타나는지 확인.
2. 승인이 필요한 정책의 그룹에서 일반 MEMBER로 일정 생성(PENDING) → 아직 참가자
   목록에 없는지 확인 → 관리자가 승인(approve) → 그 즉시 생성자가 참가자 목록에
   등장하는지 확인.
3. 그룹 정책이 "참가 신청 자동 승인 아님(requires_attendance_approval=true)"인
   상태에서 일반 MEMBER가 일정을 생성/승인받는 경우에도, 생성자 본인의 참가
   status는 정책과 무관하게 CONFIRMED로 등록되는지 확인(다른 멤버가 같은
   일정에 참가 신청하면 정책대로 PENDING이 되는 것과 대비해서 확인).
4. 기존 "참가 신청" 버튼으로 다른 멤버가 참가 신청하는 플로우가 회귀 없이 그대로
   동작하는지 확인. MANAGER/LEADER가 (본인이 만들지 않은) 남의 일정에 직접 "참가
   신청" 버튼을 눌러도 여전히 즉시 CONFIRMED로 처리되는지(기존 동작 유지) 확인.
5. group.html 모달에서 인원/정원 카운트와 참가자 명단(호버 팝오버, 참가자 관리 모달)에
   생성자가 자동으로 포함되어 보이는지 브라우저에서 확인.

## 진행 상태
- [ ] `resolveInitialStatus` 시그니처를 `(groupId, GroupScheduleVo schedule, userKey)`로
      바꾸고 "생성자 본인이면 즉시 CONFIRMED" 조건 추가
- [ ] `attend()`에서 바뀐 시그니처로 호출하도록 수정(41행에서 이미 조회한 `schedule` 전달)
- [ ] `ScheduleAttendanceService`에 `registerCreatorAsAttendee(...)` 추가(내부적으로
      확장된 `resolveInitialStatus` 재사용)
- [ ] `GroupScheduleService.createSchedule()`에 자동 등록 훅 추가
- [ ] `GroupScheduleService.approveSchedule()`에 자동 등록 훅 추가
- [ ] 검증 항목 1~5 확인
