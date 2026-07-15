# 모바일 캘린더 일자 모달 + 홈탭 스케줄 개선

## 배경
`group.html`의 모임 상세 화면은 자체 구현 캘린더(FullCalendar 등 외부 라이브러리 미사용)를
쓰고 있으며, 모바일 중심 사용성 개선을 위해 두 부분을 손봐야 한다.

1. **일정 탭 캘린더**: `renderCalendar()`(1097~1121행)가 하루 셀에 일정 제목을 최대
   3개까지 나열하고 4개 초과분은 클릭 불가능한 "+N개 더보기" 텍스트만 보여준다. 셀을
   클릭하면 `canCreateSchedule`(등록 권한) 멤버는 그 날 일정이 몇 건이든 바로 일정등록
   모달이 뜬다(1117행). 권한 없는 멤버는 `openDayView()`를 타지만, 이 함수(1150행)가
   참조하는 `calendarDayList` DOM 요소가 템플릿에 존재하지 않아 사실상 죽은 코드다.
2. **홈 탭 "스케줄" 위젯**: `updateRecentSchedules()`(1083~1094행)가 `calendarEvents`에서
   `ev.start >= now` 조건만으로 필터링해 PENDING/REJECTED/CANCELLED 일정도 그대로
   노출되고, 제목·시작시각만 보여줄 뿐 참석 인원이나 본인의 참가 상태(신청/대기/취소)를
   전혀 보여주지 않는다.

일정 상세 모달(`openEventDetail`, 486~577행)에는 이미 인원 표시(`maxAttendance`/
`confirmedCount`)와 참가 신청/취소/재신청 버튼(`loadMyAttendance`, 580~621행)이
구현되어 있어 이 로직을 그대로 재사용할 수 있다.

## 현재 코드 구조 (조사 완료, 참고용)
- 캘린더 렌더링: `group.html` `renderCalendar()` 1097~1121행
  - 셀별 이벤트 목록: `eventsByDate[dateKey]`, 1110행에서 `scheduleFilter`(기본 CONFIRMED)로
    이미 필터링된 `calendarEvents`를 날짜별로 그룹핑.
  - 셀 렌더링: 1112~1117행. 이벤트 나열(1114행) + 클릭 핸들러(1117행)가 이번 작업의 대상.
- 일자별 목록: `openDayView(date, evs)` 1150행 — 존재하지 않는 `calendarDayList`를
  참조하는 죽은 코드. `window.openCommonModal`(171~238행, `openEventDetail`이 쓰는
  것과 동일한 공통 모달 헬퍼)로 재작성한다.
- 일정등록 모달: `window.openCreateEventModal(date, prefill)` 927~1080행 — 이미 날짜
  인자를 받으므로 그대로 재사용 가능. 진입점은 상단 `globalAddEventBtn`(443행),
  캘린더 셀 클릭(1117행, 제거 대상), 상세 모달의 복제 버튼(556~558행) 3곳.
- 홈 탭 위젯: `updateRecentSchedules()` 1083~1094행, DOM 컨테이너 `#recentSchedules`
  (템플릿 104~108행, "홈" 탭 `contentHome` 안).
- 인원 표시 포맷: `openEventDetail()` 504~524행의 `capValue` 로직
  (`maxAttendance > 0 ? confirmedCount/maxAttendance+'명' : confirmedCount+'명 / 제한없음'`).
- 참가 신청/취소 로직: `loadMyAttendance(ev, containerEl, attBtn)` 580~621행.
  - `GET /api/groups/{groupId}/schedules/{scheduleId}/attendance` 전체 목록을 받아
    `list.find(a => String(a.userKey) === String(currentUserKey))`로 본인 항목만
    클라이언트에서 필터링(별도 "내 상태" 전용 API는 없음).
  - 상태 없음/REJECTED/CANCELLED → "참가 신청"/"참가 재신청" 버튼, `POST .../attend`.
  - PENDING → "참가 신청 승인 대기 중입니다" 안내 + "참가 취소" 버튼.
  - CONFIRMED → "참가 취소" 버튼, `DELETE .../attend`.
  - 성공 시 현재는 무조건 `window.closeCommonModal()` 후 "완료" 토스트 모달을 여는데,
    이는 상세 모달 안에서 호출되는 걸 전제로 한 동작이라 홈탭 위젯에서 재사용하려면
    콜백으로 분리해야 한다.
- API 응답 필드: `GroupApiController.toCalendarEvent()`(198~216행)가 `status`,
  `maxAttendance`, `confirmedCount`(CONFIRMED일 때만)를 이미 내려주고, 프론트
  `fetchSchedulesRaw()`(455행)가 이를 그대로 `calendarEvents` 항목에 매핑해둔다.
  **백엔드 변경 불필요.**

## 요구사항

### A. 캘린더 일자 모달
1. 날짜 셀은 일정 제목 나열 대신 **갯수만** 표시한다(예: 작은 배지/pill). 색상은
   그 날 이벤트들의 상태 중 우선순위(PENDING > CONFIRMED > REJECTED > CANCELLED)가
   가장 높은 상태의 기존 색상 팔레트를 재사용한다. 이벤트가 0건이면 배지를 표시하지 않는다.
2. 셀 클릭(`cell.onclick`, 1117행)은 `canCreateSchedule` 분기 없이 **항상**
   `openDayView(cellDate, evs)`를 호출한다 — **빈 날짜를 클릭해도 동일하게 모달을
   연다**(사용자 확인 완료: 빈 날짜도 일자모달 열기).
3. `openDayView(date, evs)`를 `window.openCommonModal` 기반으로 재작성:
   - 제목: 사람이 읽기 좋은 날짜 포맷.
   - `evs`를 시작시각 오름차순 나열, 각 행 클릭 시 `closeCommonModal()` →
     `openEventDetail(it)`.
   - `evs.length === 0`이면 "이 날짜에 등록된 일정이 없습니다" 빈 상태 문구.
   - **"일정추가" 버튼**을 `canCreateSchedule`일 때만 노출 — 클릭 시
     `closeCommonModal()` → `window.openCreateEventModal(date)`.
4. 셀 클릭 시 바로 일정등록 모달이 뜨던 기존 동작은 제거한다. 상단 `globalAddEventBtn`
   ("일정등록" 버튼)은 그대로 유지 — 오늘 날짜 기준 등록의 별도 진입점으로 남긴다.
5. 1116행 주석("날짜 클릭: 등록 권한 있으면 일정 등록...")을 새 동작에 맞게 갱신.

### B. 홈 탭 "스케줄" 위젯
1. `updateRecentSchedules()`의 `upcoming` 필터에 `ev.status === 'CONFIRMED'` 조건을
   추가한다 (`ev.start && ev.start >= now && ev.status === 'CONFIRMED'`).
2. 각 행에 인원 현황을 추가 표시한다 — `openEventDetail`의 `capValue` 포맷을 재사용
   (`calendarEvents` 항목에 `maxAttendance`/`confirmedCount`가 이미 있으므로 추가
   API 호출 불필요).
3. 각 행에 참가 신청/취소/재신청 버튼 + PENDING "대기중" 안내를 추가한다 —
   `loadMyAttendance(ev, rowContainerEl, attBtn)`를 그대로 호출해 상태를 채운다.
4. `loadMyAttendance` 소규모 리팩터: 신청/취소 성공 시 동작을 4번째 인자 `onSuccess`
   콜백으로 분리한다.
   - 생략 시(기존 상세 모달 호출부, 536행) 기본값 = 기존과 동일하게 `closeCommonModal()`
     + 완료 토스트(하위 호환 유지, 호출부 수정 불필요).
   - 홈탭 위젯에서 호출 시 = 모달을 닫지 않고 해당 행의 `loadMyAttendance(...)`를
     재호출(또는 `updateRecentSchedules()` 전체 재호출)해 버튼/문구만 갱신.
5. 버튼 클릭 이벤트는 `stopPropagation()`으로 막아 행 전체의 `openEventDetail`
   클릭 핸들러와 충돌하지 않게 한다.

## 명시적으로 다루지 않아도 되는 것 (스코프 아님)
- 백엔드 API 변경 — 기존 `/api/groups/{groupId}/schedules`, `/attendance`,
  `/attend`(POST/DELETE) 엔드포인트를 그대로 사용한다.
- 사이트 메인 홈(`main.html`)의 일정 목록 — 조사 결과 현재 구현이 아예 없으며,
  이번 요청의 "홈"은 모임 상세 화면의 "홈" 탭(`contentHome`)을 가리킨다. `main.html`
  개선은 로드맵의 별도 항목("내 그룹 캘린더", 6번, 이번 스프린트 보류)으로 이미 존재한다.
- 참가자 명단 팝오버(`attachRosterPopover`) 등 상세 모달의 다른 기능 — 변경 없음.

## 검증 방법
1. test01(등록 권한자)로 로그인 → 그룹 상세 → 일정 탭:
   - 여러 일정이 있는 날짜 셀에 갯수 배지만 보이는지 확인.
   - 셀 클릭 시 일자 모달이 열리고, 목록 항목 클릭 시 기존 상세 모달로 이동하는지 확인.
   - 모달의 "일정추가" 버튼으로 등록 폼이 열리고 정상 등록되는지 확인.
   - 일정 없는 날짜 클릭 시에도 빈 상태 + "일정추가" 버튼 모달이 뜨는지 확인.
2. 등록 권한 없는 일반 멤버 계정으로 동일 플로우 확인 — 일자 모달은 열리되 "일정추가"
   버튼은 보이지 않아야 함.
3. 홈 탭에서: PENDING/REJECTED/CANCELLED 상태의 테스트 일정을 만들어두고,
   "스케줄" 위젯에 CONFIRMED 일정만 노출되는지, 인원 현황(N/M명)이 보이는지,
   참가 신청 → 대기중 표시 → (관리자 승인 후) 참가 취소까지 버튼 흐름이 모달을
   열지 않고도 끊기지 않고 동작하는지 확인.
4. 브라우저 콘솔에 JS 에러가 없는지 확인(특히 `calendarDayList` 잔재 참조가 없는지).

## 진행 상태
- [x] 캘린더 셀: 갯수 배지로 교체
- [x] 캘린더 셀: 클릭 시 항상 `openDayView` 호출(빈 날짜 포함)로 단순화
- [x] `openDayView` 재작성 (`openCommonModal` 기반, "일정추가" 버튼 포함)
- [x] `updateRecentSchedules`: CONFIRMED 필터 추가
- [x] `updateRecentSchedules`: 인원 현황 표시 추가
- [x] `loadMyAttendance`: `onSuccess` 콜백 인자로 리팩터
- [x] `updateRecentSchedules`: 참가 신청/취소/재신청 버튼 + 대기중 표시 추가
- [x] 브라우저 검증 (검증 방법 1~4) — Playwright로 test01(등록권한자)/test07(일반멤버) 양쪽 확인 완료
