# 일정 조회 / 참가여부 조회 프로세스 (현재 구조)

`group.html`(모임 상세 화면)에서 일정을 조회하고, 로그인한 사용자의 참가여부(신청/대기/취소 버튼)를 화면에 그리는 현재 흐름을 정리한다. 하루에 여러 일정이 있을 때 참가 버튼이 순차적으로 늦게 나타나는 현상의 원인 파악을 위해 작성했다.

## 1. 일정 목록 조회

- **API**: `GET /api/groups/{groupId}/schedules?from=&to=`
- **컨트롤러**: `GroupApiController.getSchedules` (`src/main/java/com/moyora/clubschedule/controller/GroupApiController.java:175`)
- **서비스**: `GroupScheduleService.listSchedules(groupId, userKey, from, to)`
  - 멤버는 전체 일정 조회
  - 비멤버는 `group_schedule_policy.visibility_type`에 따라 제한(PRIVATE: 없음 / PARTIAL: 확정된 향후 일정 중 일부 / PUBLIC: 확정된 향후 일정 전체)
- **매퍼**: `GroupScheduleMapper.selectByGroupId` (`mapper/GroupScheduleMapper.xml:33`)
- 응답 변환은 `toCalendarEvent(GroupScheduleVo)` (`GroupApiController.java:297`)가 담당하며, 이 안에서 **CONFIRMED 상태인 일정마다** `scheduleAttendanceMapper.countConfirmedAttendees(scheduleId)`를 호출해 `confirmedCount`를 채운다(일정 개수만큼 DB 쿼리 반복 — 서버 내부 N+1).

### 프론트 캐시

- `group.html:881` `fetchSchedulesRaw(fromMs, toMs)` — 위 API를 호출해 이벤트 배열로 매핑
- `group.html:883` 전역 `scheduleCache`(rangeFrom/rangeTo/hasAll/events/fetchedAt) + `getSchedules(options)`가 5분 TTL로 목록을 메모리에 캐시. 캘린더 렌더링, 모달 오픈 등 대부분의 화면이 이 캐시를 공유해서 쓴다.
- ⚠️ 이 캐시는 **일정 목록만** 대상이며, 참가여부(attendance)는 캐시되지 않는다.

## 2. 참가여부 조회 (현재 문제 지점)

내가 특정 일정에 참가 신청했는지 여부를 표시하려면 별도 API를 호출한다.

- **API**: `GET /api/groups/{groupId}/schedules/{scheduleId}/attendance`
- **컨트롤러**: `ScheduleAttendanceApiController.listAttendees` (`src/main/java/com/moyora/clubschedule/controller/ScheduleAttendanceApiController.java:58`)
- **서비스/매퍼**: `ScheduleAttendanceService.listAttendees` → `ScheduleAttendanceMapper.selectActiveList(scheduleId)` (`mapper/ScheduleAttendanceMapper.xml:39`) — 해당 일정의 **참가자 전체 목록**(is_latest=1)을 반환
- **프론트 처리**: `loadMyAttendance(ev, containerEl, attBtn, onSuccess, opts)` (`group.html:1008`)
  1. 위 API를 호출해 전체 참가자 목록을 받음
  2. `list.find(a => a.userKey === currentUserKey)`로 내 항목만 필터링(`group.html:1023`)
  3. 결과(`PENDING`/`CONFIRMED`/`REJECTED`/`CANCELLED`/없음)에 따라 버튼 텍스트·색상·클릭 핸들러를 구성

이 함수는 **일정 하나당 참가자 전체 목록을 통째로 받아와서 내 것만 골라 쓰는** 방식이라, 원하는 정보(내 상태 1건)에 비해 응답이 과하게 크고, 무엇보다 **호출 자체가 일정 개수만큼 반복**된다.

### 호출 지점 3곳 (모두 동일한 N+1 패턴)

| 화면 | 위치 | 호출 방식 |
|------|------|-----------|
| 날짜별 일정 모달 | `openDayView` (`group.html:1805`) | `sorted.forEach(...)` 루프 안에서 CONFIRMED 일정마다 `loadMyAttendance` 호출 (`group.html:1835`) — **스크린샷 사례** |
| 일정 상세 모달 | `openEventDetail` (`group.html:912`) | 단건이라 호출 1회 (`group.html:962`) |
| 홈 임박 일정 카드(최대 3건) | `updateRecentSchedules` (`group.html:1730`대) | `upcoming.forEach(...)` 루프 안에서 최대 3회 호출 (`group.html:1762`) |

날짜별 모달처럼 하루에 여러 건이 몰려 있으면, 일정 개수만큼 `fetch`가 순차/병렬로 발생하고 각 응답이 도착하는 순서대로 버튼이 하나씩 늦게 채워진다 — 스크린샷에서 보이는 "버튼 생성까지 기다림" 현상의 원인이다.

## 3. 참가 신청 / 취소 시 갱신 흐름

- 신청: `POST /api/groups/{groupId}/schedules/{scheduleId}/attend`
- 취소: `DELETE /api/groups/{groupId}/schedules/{scheduleId}/attend`
- 성공 후 각 호출부는 `getSchedules({ all:true, forceRefresh:true })`로 **일정 목록 캐시만** 강제 갱신하고 화면을 다시 그린다(`group.html:1762`, `1836`). 참가여부는 캐시 대상이 아니므로 다시 그릴 때 `loadMyAttendance`가 또 한 번씩 호출된다.

## 4. 참고 — 이미 존재하는 관련 API/쿼리

- `ScheduleAttendanceMapper.selectLatest(scheduleId, userKey)` (`mapper/ScheduleAttendanceMapper.xml:30`) — 특정 스케줄에 대한 **특정 사용자 1명**의 최신 참가 상태만 조회하는 단건 쿼리. 현재는 신청/취소 처리 로직 내부에서만 쓰이고 있고, 위 `loadMyAttendance` 흐름에서는 사용되지 않음(대신 전체 목록을 받아 클라이언트에서 필터링).
- 코드베이스 전체에 `IN` 절/`List<Long>` 파라미터로 여러 건을 한 번에 조회하는 벌크 매퍼 패턴은 아직 없음(그룹 일정/참가여부 관련 모두 단건 파라미터 기준).

## 개선 방향 (별도 계획)

목록 조회 시점에 각 일정의 내 참가여부까지 함께 내려주면(`selectLatest`를 `toCalendarEvent` 생성 시 재사용) 위 N+1 호출이 완전히 사라진다. 구체적인 변경 범위는 별도 구현 계획(`일정 조회 시 참가여부 함께 반환` 플랜)에 정리되어 있으며, 아직 코드에는 반영되지 않은 상태다.
