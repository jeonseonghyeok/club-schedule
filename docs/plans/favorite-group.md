# 우선모임(즐겨찾기) 지정/변경/해제

## 배경
사용자마다 소속된 모임이 여러 개일 수 있는데, 그중 자주 확인하는 모임을 빠르게
구분할 방법이 없다. 사용자당 최대 1개의 모임을 "우선모임"으로 지정할 수 있게 하고,
모임 상세 페이지(`/groups/{groupId}`)의 탭 바에서 별 모양 버튼으로 토글하도록 한다.

## 현재 코드 구조 (조사 완료, 참고용)
- `user` 테이블(`docs/DATABASE.md` 38~47행, `UserVo.java`)은 `user_key`, `kakao_api_id`,
  `nickname`, `created_at`, `referrer_url`, `system_role`만 담는, 카카오 프로필 등
  **사용자 고유 스칼라 정보 전용** 테이블이다. 그룹과의 관계는 전혀 없다.
- `group_member` 테이블(`docs/DATABASE.md` 127~139행)은 PK가 `(group_id, user_key)`인
  전형적 N:M 관계 테이블로, 사용자당 여러 행(여러 그룹 가입)이 정상이다. "사용자당 최대
  1개"라는 제약과는 성격이 다르다.
- `group` 테이블은 이미 `leader_user_key`처럼 다른 테이블(user)을 가리키는 단일 FK
  컬럼을 쓰고 있다(`docs/DATABASE.md` 52~68행, `fk_leader_user`) — 동일 패턴을 재사용할
  수 있다.
- 마이그레이션 컨벤션: `docs/migration_v{N}.sql`을 작성 → DB 적용 → `docs/DATABASE.md`에
  "이 스키마는 migration_vN 적용 이후 기준"으로 갱신 → SQL 파일 자체는 저장소에서 삭제
  (적용 이력은 DATABASE.md 컬럼 주석으로만 남김). 가장 최근 사용 번호가 v4까지이므로
  다음은 `docs/migration_v5.sql`.
- `UserMapper.xml`(`src/main/resources/mapper/UserMapper.xml`)에 `SELECT ... FROM \`user\``
  형태의 조회 5개(`selectByKakaoApiId`, `selectByUserKey`, `selectAllOrderByUserKeyDesc`,
  `selectByNickname`, `selectTestAccounts`)가 모두 동일 컬럼 목록을 나열한다.
- `CustomUserDetails`(`src/main/java/com/moyora/clubschedule/security/CustomUserDetails.java`)는
  `userKey`와 `authorities` 2개 필드뿐이며, `JwtAuthenticationFilter` → `KakaoTokenUtil`이
  매 요청마다 DB에서 사용자 정보를 재조회하는 stateless 구조다(토큰에 커스텀 클레임 없음).
  → 즐겨찾기 값을 JWT/세션에 캐싱할 필요가 없다.
- 컨트롤러 역할 분리:
  - `GroupController.java`(`/groups` 접두어) — `GET /groups/me`(로그인 사용자의 그룹 목록,
    27~33행), `PATCH /groups/{groupId}`(그룹 메타 수정, 43~55행) 등 "로그인 사용자 관점"
    API가 모여 있다.
  - `GroupApiController.java`(`/api/groups` 접두어) — 멤버/스케줄 등 그룹 리소스 CRUD 전담.
  - `GroupViewController.java` — `GET /groups/{groupId}` 뷰 렌더링 전용(25~54행).
  - 판단: "우선모임 지정"은 그룹 리소스 자체보다 로그인 사용자의 선택 상태를 바꾸는
    것이므로 `GroupController.java`에 추가하는 편이 기존 역할 분리와 맞는다. 멤버 검증은
    `GroupManageService.isMember(groupId, userKey)`(`GroupViewController.java:37`,
    `GroupApiController` 곳곳에서 이미 재사용 중)를 그대로 쓴다.
- `group.html` 탭 바 마크업(77~84행):
  ```html
  <div class="tabs" style="justify-content:space-between;">
      <div style="display:flex;gap:8px;">
          <div id="tabHome" class="tab active">홈</div>
          <div id="tabSchedule" class="tab">일정</div>
          <div id="tabManage" class="tab" th:if="${isManager}">관리</div>
      </div>
      <div id="joinAction" th:if="${!isMember}"></div>
  </div>
  ```
  `.tabs`는 `justify-content:space-between`이라 왼쪽 탭 묶음과 오른쪽 `#joinAction`(비회원
  전용 "가입하기" 슬롯)의 2열 구조다. 별 버튼은 `isMember`일 때만 의미 있고 `joinAction`은
  `!isMember`일 때만 렌더링되므로 두 요소가 동시에 보이는 경우는 없어 레이아웃 충돌이 없다.
  탭 클릭 바인딩은 `<script th:inline="javascript">` 블록(240~273행 부근, `activateTab`)에
  있으며, 별 버튼은 탭이 아니라 별도 토글이므로 이 로직에 넣지 않고 독립 이벤트 리스너로
  추가한다.
- 완료 토스트 UI 패턴: `loadMyAttendance()`(`group.html` 580~621행)가 신청/취소 성공 시
  `window.openCommonModal({title:'완료', content:..., size:'sm'})`로 짧은 완료 메시지를
  띄우는 기존 관례가 있다 — 이번 기능의 등록/변경/해체 메시지도 동일 패턴을 재사용한다.

## 요구사항
1. **DB**: `user` 테이블에 `favorite_group_id BIGINT UNSIGNED NULL` 컬럼 추가,
   `group(group_id)` 참조 FK를 `ON DELETE SET NULL`로 건다(그룹이 삭제되면 즐겨찾기도
   자동으로 풀리게). `docs/migration_v5.sql`로 작성.
2. **백엔드**:
   - `UserVo.java`에 `favoriteGroupId` 필드 추가.
   - `UserMapper.xml`의 5개 SELECT에 `favorite_group_id` 컬럼 추가, `updateFavoriteGroup
     (userKey, groupId)` UPDATE 문 신설(`groupId`에 `null`을 넘기면 해제).
   - `UserMapper.java`에 `updateFavoriteGroup(Long userKey, Long groupId)` 메서드 추가.
   - `GroupController.java`에 신설:
     - `PUT /groups/{groupId}/favorite` — 로그인 필요(401), `isMember` 아니면 403.
       현재 `favorite_group_id`를 무조건 이 groupId로 덮어쓴다(등록이든 변경이든 동일 호출).
     - `DELETE /groups/{groupId}/favorite` — 로그인 필요(401). 현재 `favorite_group_id`가
       이 groupId와 같을 때만 null로 해제(다르면 아무 효과 없이 200 또는 409 중 택1 —
       프론트가 항상 "현재 내 우선모임인 경우에만" 호출하므로 실무적으로는 발생하지 않음,
       방어적으로만 조건 체크).
   - `GroupViewController.manageView()`에 `UserService` 의존성 추가, 모델에
     `isFavoriteGroup`(이 그룹이 내 우선모임인지)과 `hasFavoriteGroup`(우선모임이 하나라도
     있는지) 두 불리언 추가.
3. **프론트 (`group.html`)**:
   - 탭 바 `#joinAction`(83행) 뒤에 `th:if="${isMember}"`인 별 버튼 추가. 초기 아이콘
     상태는 서버가 내려준 `isFavoriteGroup` 값으로 채워진 채워짐/빈 별로 표시.
   - 클릭 핸들러 분기:
     - `isFavoriteGroup === true` → `DELETE /groups/{groupId}/favorite` → 성공 시
       **"우선모임이 해체되었습니다."** 토스트, 별 아이콘을 빈 별로 갱신.
     - `hasFavoriteGroup === false` → `PUT /groups/{groupId}/favorite` → 성공 시
       **"우선모임으로 등록되었습니다."** 토스트, 별 아이콘을 채워진 별로 갱신.
     - `hasFavoriteGroup === true && isFavoriteGroup === false` → 브라우저 `confirm(
       '우선모임을 변경하시겠습니까?')` → 동의 시에만 `PUT` 호출 → 성공 시 **"우선모임이
       변경되었습니다."** 토스트, 별 아이콘 갱신. 취소 시 아무 요청도 보내지 않고
       아이콘도 그대로 둔다.

## 스코프 아님 (명시적으로 다루지 않음)
- `GET /groups/me`(홈 화면 "내 모임" 목록)에 즐겨찾기 배지 표시 — 확장 포인트로만 남김
  (`GroupVo`에 `isFavorite` 필드 + `GroupMemberMapper.xml`의 `selectGroupsByUser`에
  서브쿼리 컬럼 추가하면 됨).
- 우선모임 그룹의 멤버십만 잃은 경우(탈퇴/강퇴) 정리 로직 — FK `ON DELETE SET NULL`은
  그룹 자체가 삭제된 경우만 커버한다. 멤버십만 잃은 경우는 `favorite_group_id`가 남아있어도
  `GroupViewController`의 기존 `isMember=false` 처리로 화면이 정상적으로(비회원 뷰로)
  표시되므로 별도 처리 없이 그대로 둔다.
- JWT/세션에 즐겨찾기 값 캐싱 — 매 요청 DB 재조회 구조라 불필요.
- 로그인/홈 접근 시 우선모임으로 자동이동하는 기능 — 별도 계획 문서
  [favorite-group-auto-redirect.md](favorite-group-auto-redirect.md)의 스코프이며,
  이 문서가 추가하는 `favorite_group_id` 컬럼에 의존한다.

## 검증 방법
1. test01로 그룹 A 상세 페이지에서 별 버튼 클릭 → "우선모임으로 등록되었습니다." 확인 →
   DB(`user.favorite_group_id`)에 반영됐는지 확인.
2. 그룹 B 상세 페이지에서 별 버튼 클릭 → "우선모임을 변경하시겠습니까?" 확인 모달 →
   동의 → "우선모임이 변경되었습니다." → DB 값이 B로 바뀌었는지 확인. 취소를 눌렀을 때는
   DB 값이 그대로(A) 유지되는지 확인.
3. 그룹 B에서 다시 별 버튼 클릭(이미 내 우선모임) → "우선모임이 해체되었습니다." →
   DB 값이 NULL인지 확인.
4. 비회원(그룹 미가입) 계정으로 그룹 상세 페이지 접근 시 별 버튼이 보이지 않는지 확인.

## 진행 상태
- [ ] `docs/migration_v5.sql` 작성 및 적용(`user.favorite_group_id` 컬럼 + FK)
- [ ] `UserVo` — `favoriteGroupId` 필드 추가
- [ ] `UserMapper.xml`/`UserMapper.java` — 컬럼 반영 + `updateFavoriteGroup` 추가
- [ ] `GroupController` — `PUT`/`DELETE /groups/{groupId}/favorite`
- [ ] `GroupViewController` — `isFavoriteGroup`/`hasFavoriteGroup` 모델 추가
- [ ] `group.html` — 별 버튼 마크업 + 토글 JS(등록/변경 확인/해체 메시지 분기)
- [ ] 검증 방법 1~4 확인
