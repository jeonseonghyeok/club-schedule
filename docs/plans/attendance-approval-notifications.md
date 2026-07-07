# 참가 신청 승인 프로세스 — 알림 연동

## 배경
그룹 가입 요청(`GroupJoinRequestService`)과 그룹 생성 신청(`GroupRequestService`)은
승인/거부 시점에 신청자 본인에게 `NotificationService.createNotification()`으로
알림을 생성하는 동일한 패턴을 이미 갖고 있다. 반면 일정 참가 신청을 다루는
`ScheduleAttendanceService`는 `attend()`/`approveAttendance()`/`rejectAttendance()`
/`forceCancel()`/`checkActual()` 어디에도 `NotificationService`가 주입되어 있지
않고, 알림 생성 호출이 전혀 없다(grep 확인, 0건). 참가 신청이 PENDING으로 쌓여도
관리자/일정 생성자가 이를 알아챌 방법이 "관리" 모달을 열어 직접 확인하는 것뿐이라,
승인 프로세스가 사실상 절반만 구현된 상태다.

이 갭은 [ROADMAP.md](../ROADMAP.md) 9번 항목("알림 조회/읽음 API 없음")과는
**별개의 문제**다. 9번은 "알림은 만들어지는데 볼 API가 없다"는 것이고, 이 계획은
"참가 신청 흐름에서는 알림 자체가 아예 생성되지 않는다"는 것이다.

## 현재 코드 구조 (조사 완료, 참고용)
- **알림 생성 헬퍼**: `NotificationService.createNotification(Notification n)`
  (NotificationService.java:13-15) — `Notification` VO를 그대로 insert하는 얇은 래퍼.
- **VO 필드** (`Notification.java:10-20`): `userKey`(수신자), `sourceTable`(enum
  `GROUP_CREATE_REQUEST`/`GROUP_JOIN_REQUEST`/`SCHEDULE`), `sourceId`, `category`
  (enum `APPROVE`/`REJECT`/`NOTICE`), `title`, `content`, `isRead`.
  **`SCHEDULE`는 DB enum에 이미 정의되어 있으나 실제 코드에서 쓰인 적이 없다** —
  이번 작업에서 처음 사용하게 되는 슬롯.
- **기존 사용 패턴** (그대로 참고/복사할 대상):
  - `GroupJoinRequestService.java:114-123`(승인) / `128-144`(거부) — 상태 변경
    직후 신청자(`requester`)에게 `sourceTable="GROUP_JOIN_REQUEST"`,
    `category="APPROVE"/"REJECT"`로 알림 생성.
  - `GroupRequestService.java:92-105`(승인) / `109-131`(거부) — 동일 패턴,
    `sourceTable="GROUP_CREATE_REQUEST"`.
- **`ScheduleAttendanceService` 관련 메서드**: `attend()`(39-68), `approveAttendance()`
  (98-111), `rejectAttendance()`(116-129) — 전부 `NotificationService` 미주입,
  알림 호출 없음.
- **DB 테이블** (`docs/DATABASE.md:22-33`): `notification` 테이블, `category`는
  `APPROVE`/`REJECT`/`NOTICE`뿐 — "누가 참가 신청했다"처럼 승인 요청 자체를 알리려면
  `NOTICE`를 재사용해야 함.

## 요구사항
1. **참가 승인/거부 시 신청자 본인에게 알림 생성** (최우선, 기존 패턴 그대로 복제)
   - `ScheduleAttendanceService`에 `NotificationService` 주입 추가.
   - `approveAttendance()` 성공 직후: `sourceTable=SCHEDULE`, `sourceId=scheduleId`,
     `category=APPROVE`, 수신자 `userKey=신청자(targetUserKey)`, title/content는
     일정 제목을 포함해 "참가 신청이 승인되었습니다" 형태로 구성.
   - `rejectAttendance()` 성공 직후: 동일하되 `category=REJECT`.
   - `GroupJoinRequestService`의 승인/거부 알림 생성 코드(114-144행)를 그대로
     구조만 옮겨서 재사용하면 됨 — 새 패턴을 발명하지 않는다.
2. **관리자가 대기 중인 참가 신청을 알아챌 수단 제공** (2순위, 알림 조회 API 없이도
   동작하는 저비용 대안)
   - 알림을 "생성"해도 [ROADMAP.md](../ROADMAP.md) 9번(조회/읽음 API)이 아직 없어
     사용자가 알림 목록을 볼 방법이 없다. 그 전에 먼저 값어치 있는 개선은 UI에
     PENDING 건수를 직접 노출하는 것.
   - `group.html`의 "관리" 링크(`mgrLink`, openEventDetail 내부) 옆에 대기 인원 수를
     붙인다 — 예: "관리 (2)". 데이터 소스는 이미 호출 중인
     `GET /api/groups/{groupId}/schedules/{scheduleId}/attendance` 응답에서
     `status==='PENDING'` 개수를 세면 되므로 백엔드 변경 없이 프론트에서만 처리
     가능(단, 현재 이 데이터는 팝오버/관리모달을 열 때만 fetch하므로, 배지를 항상
     보여주려면 모달을 열기 전에도 pending 건수를 알아야 함 — 이 경우 백엔드
     `confirmedCount`처럼 `pendingCount` 필드를 `toCalendarEvent()`에 추가하는 편이
     더 저렴하고 일관적임. `GroupApiController.java`의 `confirmedCount` 추가 패턴
     그대로 재사용 가능).
3. **참가 신청 시점에 관리자/생성자에게 알림을 보낼지는 이번 스코프에서 제외**
   - 그룹 가입/생성 신청도 "신청 시점에 승인자에게 알림"은 기존에 구현되어 있지
     않다(승인/거부 결정 시점에만 신청자에게 알림). 여기서도 동일한 컨벤션을 따라
     신청 시점 알림은 넣지 않는다 — 새 패턴을 만들지 않고 기존 관례 범위 안에서만
     확장한다. 필요해지면 별도 계획으로 분리.

## 명시적으로 다루지 않아도 되는 것 (스코프 아님)
- 알림 조회/읽음 API 자체 구현 — [ROADMAP.md](../ROADMAP.md) 9번 항목으로 이미 별도
  등록되어 있음. 이 계획은 "알림 생성"까지만 다룬다.
- `forceCancel()`, `checkActual()`(출석 체크)에 대한 알림 — 요청받은 범위(승인 프로세스)
  밖이므로 제외.
- [schedule-creator-auto-attend.md](schedule-creator-auto-attend.md)(일정 생성자
  자동 참가 등록)와는 독립적인 계획이다. 순서 의존성 없음 — 어느 쪽을 먼저 구현해도
  무방하다.

## 검증 방법
1. 일반 MEMBER가 CONFIRMED 일정에 참가 신청(PENDING) → 관리자가 "관리" 모달에서
   승인 → `notification` 테이블에 신청자 앞으로 `sourceTable=SCHEDULE,
   category=APPROVE` 행이 생성되는지 DB에서 직접 확인(조회 API가 없으므로 DB로 확인).
2. 동일하게 거부(reject) 시 `category=REJECT` 행 생성 확인.
3. (2번 요구사항 구현 시) "관리" 링크 옆 대기 건수 배지가 실제 PENDING 개수와
   일치하는지, 참가 신청/승인/거부 후 새로고침하면 숫자가 갱신되는지 확인.
4. 그룹 가입 요청 승인/거부 알림 흐름이 이번 변경으로 회귀 없이 그대로 동작하는지 확인.

## 진행 상태
- [ ] `ScheduleAttendanceService`에 `NotificationService` 주입
- [ ] `approveAttendance()`/`rejectAttendance()`에 알림 생성 추가
- [ ] (선택) `pendingCount` 필드 추가 + "관리" 링크 배지 UI
- [ ] 검증 항목 1~4 확인
