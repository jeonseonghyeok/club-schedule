# 역할별 개발요구사항 분석 (2026-08-04)

## 개요

이 문서는 club-schedule의 현재 구현 상태를 **일반사용자 / 모임매니저 / 모임리더 / 관리자 / 개발자** 5개 관점에서 재점검하여 미비점·개선점·불일치를 정리한 것이다. 새 기능 제안이 아니라 **이미 구현된 기능의 완성도 감사**를 목적으로 하며, 각 항목은 코드 근거(파일:라인)를 동반한다.

조사 방법: 각 관점을 독립된 서브에이전트가 병렬로 코드를 직접 읽어 조사했고, 이 문서는 5개 결과를 종합하며 핵심 주장(권한 문자열 불일치, 존재하지 않는 메서드 참조) 2건을 재검증했다.

---

## 교차 이슈 (여러 관점에서 공통 발견, 우선 검토 권장)

### 1. `PATCH /groups/{groupId}` — 존재하지 않는 메서드를 참조하는 파손된 엔드포인트 [확정 버그]

`GroupController.java:48`의 `@PreAuthorize("@groupManageService.isLeaderOrSubLeader(#groupId, principal.userKey)")`가 참조하는 `isLeaderOrSubLeader` 메서드는 `GroupManageService`를 포함해 프로젝트 전체에 **정의가 없다** (grep 재검증 완료 — service 계층에 `isLeaderForRequest`만 존재, `isLeaderOrSubLeader`는 없음). 호출 시 SpEL 평가 예외가 발생해야 정상이며, 그룹 이름/설명/정원/자동승인/일정정책을 수정하는 유일한 API가 사실상 동작 불가 상태다. `docs/ROADMAP.md:34`는 이 기능을 "완료"로 표기하고 있어 **문서-코드 괴리**도 함께 존재한다.
— (모임리더 관점 / 개발자 관점 공통 발견)

### 2. `hasRole('ADMIN')` vs `hasRole('ROLE_ADMIN')` 불일치 [확정 버그, 죽은 코드]

`GroupRequestController.java:86, 111`은 `@PreAuthorize("hasRole('ROLE_ADMIN')")`을 사용하는데, Spring Security의 `hasRole()`은 인자 앞에 자동으로 `ROLE_` 접두사를 붙이므로 실제로는 `ROLE_ROLE_ADMIN` 권한을 요구한다(재검증 완료). 반면 실제 부여되는 authority는 `ROLE_ADMIN`이므로 이 두 엔드포인트(그룹 생성신청 승인/반려)는 어떤 관리자 계정으로도 통과할 수 없다. `AdminApiController`/`AdminViewController`는 `hasRole('ADMIN')`으로 올바르게 작성되어 있고 관리자 화면은 그쪽 엔드포인트를 사용하므로 실서비스 장애로는 드러나지 않았을 뿐, `GroupRequestController` 쪽은 죽은 코드다. `docs/API.md:602`, `docs/ROADMAP.md:89`에 이미 삭제 대상으로 문서화되어 있으나 코드에는 남아 있다.
— (관리자 관점 / 개발자 관점 공통 발견)

### 3. 역할 승격/강등(멤버 ↔ 매니저 ↔ 리더) API 부재

`group_member.role`을 바꾸는 서비스/API가 코드베이스 어디에도 없다. `GroupMemberMapper`에 역할 갱신 쿼리 자체가 없으며, CLAUDE.md의 테스트 계정 안내도 "실제 LEADER/MANAGER 권한을 테스트하려면 DB에서 직접 `group_member.role`을 지정해야 함"이라고 명시해 이를 뒷받침한다. 리더는 매니저를 임명할 수단이 없다.
— (모임매니저 관점 / 모임리더 관점 공통 발견)

### 4. 매니저 개인별 권한 override(`CREATE_SCHEDULE_DIRECT`, `MANAGE_SCHEDULE`) 부여 수단 부재

`GroupMemberPermissionMapper`(및 대응 XML)에는 조회(`countPermission`, `findIsAllowed`)만 있고 INSERT/UPDATE/DELETE가 전혀 없다. `group.html:125-130`의 "권한 관리 (리더 전용)" 카드도 `permissionsList` div만 존재할 뿐 이를 채우는 JS 렌더 로직이 없어 영구히 "로딩 중..."으로 멈춘다. `docs/ROADMAP.md:48-54`도 미구현으로 명시. 결과적으로 override는 DB를 직접 조작하지 않는 한 부여 불가능한 죽은 기능이며, 매니저는 승인 권한 없이 대기만 거는 "이름뿐인 매니저"가 되기 쉽다.
— (모임매니저 관점 / 모임리더 관점 공통 발견, 항목 3과 근본 원인이 같음: 역할/권한 변경을 위한 쓰기 경로 자체가 미구현)

### 5. 알림 체계가 구조적으로 미비

- 일정 시간/장소 변경·취소 시 참가 신청자에게 알림이 가지 않음(`GroupScheduleService.editSchedule`/`cancelSchedule`이 `NotificationService`를 호출하지 않음) — 노쇼 유발 가능
- 강퇴/차단 시에도 알림 없음(`GroupManageService.banMember`/`unbanMember`)
- 알림 카테고리가 `APPROVE`/`REJECT`/`NOTICE` 3종뿐이라 가입승인·그룹생성승인·출석승인이 전부 `APPROVE`로 뭉뚱그려짐
— (일반사용자 관점 / 모임매니저 관점 공통 발견)

### 6. 감사로그·처리자 추적 불일치

`group_create_request`는 `updated_by`, `status_updated_at`으로 처리 관리자·시각을 남기지만, `group_join_request`의 승인/거부 쿼리(`GroupJoinRequestMapper.xml`)에는 처리자 컬럼이 없어 누가 가입 요청을 승인/거부했는지 추적 불가능하다. 별도 감사로그 테이블도 없다.
— (관리자 관점 / 개발자 관점(에러처리·추적성) 인접 이슈)

### 7. 그룹 연속성(승계·탈퇴·삭제) 기능 전무

리더 승계(양도), 리더 본인 탈퇴, 그룹 삭제/비활성화 기능이 모두 없다(`group.leader_user_key`를 바꾸는 UPDATE 자체가 없음). 항목 3(역할변경 API 부재)과 결합하면, 리더가 탈퇴·잠수 시 그룹을 관리할 사람이 아무도 남지 않을 수 있는데 관리자 개입 절차나 자동 위임 로직도 없다.
— (모임리더 관점, 관리자 관점의 "권한 세분화 부재"와 함께 보면 서비스 연속성 리스크로 확대됨)

---

## 역할별 상세 Findings

### 일반사용자

- **[출석 이력 조회]** 본인의 과거 출석 이력을 모아보는 화면이 없음 — 매니저 전용 "참가자 관리" 모달(`group.html:872~920`) 안에만 이력보기가 있고, 일반 멤버는 각 일정의 참가 상태만 개별 확인 가능
- **[일정 변경/취소 알림 부재]** 교차 이슈 5 참고
- **[알림 카테고리 부족]** 교차 이슈 5 참고 — 가입승인/그룹생성승인/출석승인이 모두 `APPROVE`로 뭉뚱그려져 구분 불가
- **[즐겨찾기 활용도 낮음]** ★ 토글(`group.html:41~45, 244~266`) 기능만 있고, "내 모임"/"모임 검색" 어디에도 즐겨찾기 기준 정렬·필터·뱃지가 없어 존재 이유가 불명확
- **[가입요청 취소 API의 HTTP 시맨틱 불일치]** `DELETE /join-requests/{requestId}`이지만 실제로는 상태값을 `CANCELLED`로 바꾸는 소프트 취소(`GroupJoinRequestService.cancelJoin`) — 동작은 정상이나 메서드명이 오해 소지
- **[비회원 경험 부재]** 비로그인 시 모임 목록/검색 자체를 볼 수 없어(`main.html:69~82`) 가입 전 "둘러보기"가 불가능, 신규 유입 장벽
- (참고, 양호 사례) 그룹 생성신청/가입요청 반려 사유는 프론트에 정상 노출됨(`main.html:128~131,383~384`, `group.html:341~344`)

### 모임매니저

- **[권한 부여 수단 부재]** 교차 이슈 4 참고
- **[매니저 기본값이 사실상 일반회원과 동일]** override 부여가 막혀 있어 실무상 매니저 역할을 받아도 일정 승인은 항상 PENDING(`GroupPermissionService.resolveCreatePermission`)
- **[회원 추방 권한이 오히려 더 느슨함]** `GroupManageService.banMember:82`는 `isManager()`만 확인, LEADER/MANAGER 구분 없이 무조건 허용 — 세분화된 일정 승인 override 체계와 대비되는 비일관성
- **[강퇴/차단 시 알림 없음]** 교차 이슈 5 참고
- **[역할 승격/강등 기능 전무]** 교차 이슈 3 참고
- **[참가 승인 일괄처리 부재/비대칭]** 참가 신청 승인은 1건씩만 가능(`group.html:982~1024`), 체크인 단계는 "전체 참석"만 있고 "전체 불참" 일괄 버튼은 없음
- **[체크인 저장 실패 시 부분실패 안내 부족]** `renderCheckEdit`(`group.html:1148~1173`)이 여러 건을 `Promise.all`로 동시 요청 후 첫 실패만 노출 — 어떤 건이 실패했는지 알 수 없어 재시도 시 중복 처리 위험
- **[PENDING 일정은 매니저도 수정 불가]** `validateEditPermission:141~162` — 작성자 본인만 수정 가능, MANAGE_SCHEDULE 권한이 있어도 예외 없음. 오탈자도 반려 후 재작성 필요

### 모임리더

- **[그룹 정보 수정 API 파손]** 교차 이슈 1 참고
- **[리더 승계/양도 불가]** 교차 이슈 7 참고
- **[매니저 승격/강등 API 부재]** 교차 이슈 3 참고
- **[권한 관리 UI가 빈 껍데기]** 교차 이슈 4 참고
- **[매니저 상호 강퇴/강등 불가]** `GroupManageService.banMember:82` 조건상 매니저는 서로(리더 포함) 내보낼 수 없게 하드코딩 — 역할변경 API 부재와 겹쳐 문제 있는 매니저를 강등/추방할 수단이 없음
- **[본인 탈퇴 API 없음]** 강퇴용 `banMember`만 있고 자진 탈퇴는 없음(`docs/ROADMAP.md:74~78`에도 명시)
- **[그룹 삭제/비활성화 기능 없음]** 활동을 접어도 빈 그룹이 검색·추천 목록에 계속 노출
- **[리더 부재 시 연속성 장치 없음]** 교차 이슈 7 참고
- **["서브리더" 개념의 이름-구현 불일치]** `GroupRole` enum은 LEADER/MANAGER/MEMBER 3종뿐인데 `GroupController.java:48`의 (존재하지 않는) 권한식은 "SubLeader"를 언급 — 설계 의도와 구현 사이 괴리

### 관리자

- **[`GroupRequestController` 승인/반려 500·403 유발 버그]** 교차 이슈 2 참고
- **[관리자 권한 세분화 부재]** `system_role`은 `ENUM('USER','ADMIN')` 두 값뿐(`docs/DATABASE.md:45`) — 슈퍼관리자/도메인별 관리자 구분 없음, 관리자가 늘면 최소권한 원칙 유지 불가
- **[가입요청 감사로그 부재]** 교차 이슈 6 참고
- **[관리자가 가입요청을 직접 승인/거부할 수단 없음]** `AdminApiController`의 `/admin/api/group-joins`는 GET(조회)만 있고 승인/거부 API가 없음 — 실제 처리는 그룹 화면(매니저/리더)에서만 가능해 전체 서비스 관리자의 개입 경로가 없음
- **[페이징 비일관성/성능 우려]** `/admin/api/group-joins`는 DB 페이징 없이 전체 로딩 후 자바 스트림 필터링, `/users`·`/groups`는 DB 페이징 사용 — 건수가 늘면 성능 저하 우려
- **[반려사유 통계·집계 불가]** `reject_reason`이 자유 입력 `TEXT`라 "가장 흔한 반려 사유" 같은 트렌드 파악 불가
- **[서비스 통계 대시보드 부재]** 가입자 추이, 활성 그룹 수, 신청 처리 소요시간 등을 보여주는 화면/API가 전무 — 원자료 표만 확인 가능
- **[검색 필터의 프론트-백엔드 계약 미검증]** `admin.js`의 `buildParamsFromForm`이 폼 필드를 그대로 쿼리파라미터로 전달하는데, 서비스/매퍼가 실제 지원하는 필터 키인지는 개별 확인 필요 — 미구현 필터가 조용히 무시될 위험

### 개발자

- **[권한 문자열 일관성]** 교차 이슈 2 참고 — 신규 개발자가 죽은 코드를 살아있는 경로로 착각할 위험
- **[테스트 커버리지 부족]** `src/test/`에 3개 파일(46~75줄 규모)만 존재하며 `group_create_request` 도메인만 커버 — 가입요청/일정/출석/관리자 API/JWT 필터는 자동화 테스트 전무, `scripts/test-join-requests.ps1` 등 수동 스크립트에 의존
- **[CI가 테스트를 실행하지 않음]** `.github/workflows/deploy.yml`은 빌드 후 즉시 Docker 배포하며 테스트 단계 없음, `Dockerfile`도 `./gradlew clean bootJar`만 실행 — 존재하는 3개 테스트조차 CI에서 검증 안 되고 master push 시 바로 배포
- **[빌드 설정의 암묵적 수동 단계]** `build.gradle`(`-parameters` 플래그) 변경 후 Eclipse Buildship에서 수동 Gradle Refresh가 필요 — 누락 시 전 컨트롤러의 `@RequestParam`/`@PathVariable`이 동시에 깨지는 단일 실패점(SPOF)
- **[마이그레이션 문서-실제 스키마 불일치 전례]** `docs/DATABASE.md`에 "`migration_v3.sql`은 실제 DB에 적용된 적 없음", "`uniq_group_user` 제약은 문서에만 있고 DB엔 없었음" 등 문서-실스키마 불일치가 이미 기록됨 — 향후 문서만 믿고 스키마 변경 시 위험
- **[전역 예외처리의 정보 노출 위험]** `GlobalExceptionHandler`의 catch-all 핸들러가 `ex.getMessage()`를 그대로 클라이언트에 반환 — 내부 구현 정보(SQL, 필드명 등) 노출 가능성
- **[문서-코드 괴리]** 교차 이슈 1(`isLeaderOrSubLeader`)처럼 `docs/ROADMAP.md`가 "완료"로 표기한 기능이 실제로는 파손/미구현인 사례가 다수 발견됨 — 로드맵 문서의 신뢰도 저하

---

## 우선순위 제안 (참고용)

이 문서 자체는 우선순위를 매기지 않는 감사 결과이지만, 교차 이슈 중 **1번(파손된 그룹 수정 API)**과 **2번(권한 문자열 버그)**은 코드 삭제/한 줄 수정 수준으로 해결 가능하면서 명백한 결함이므로 가장 먼저 처리할 후보로 보인다. **3번(역할 변경 API)**과 **4번(권한 override 부여 API)**은 근본 원인이 같은(쓰기 경로 미구현) 더 큰 작업으로, 모임매니저·모임리더 관점 다수 항목의 선행 조건이다.
