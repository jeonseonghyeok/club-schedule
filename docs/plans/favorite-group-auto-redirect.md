# 로그인/홈 접근 시 우선모임 자동이동

## 배경
"우선모임" 지정 기능([favorite-group.md](favorite-group.md))이 구현된 뒤, 사용자가
로그인 직후 또는 주소창을 통해 홈 화면(`/`)에 직접 접근했을 때 곧바로 우선모임 상세
페이지로 이동시켜 매번 모임 목록에서 찾아 들어가는 수고를 줄인다. 단, 그룹 상세 화면의
"목록으로" 링크를 통해 의도적으로 홈(모임 목록)으로 돌아가는 경우에는 자동이동이 발생하면
안 된다 — 사용자가 명시적으로 목록을 보려는 것이므로 우선모임으로 다시 튕겨나가면 안 된다.

> **선행 의존성**: 이 문서는 [favorite-group.md](favorite-group.md)에서 추가하는
> `user.favorite_group_id` 컬럼과 `UserService.getUserByUserKey(...).getFavoriteGroupId()`가
> 이미 존재한다는 전제로 작성됐다. 구현 착수는 그 문서가 완료된 뒤여야 한다.

## 현재 코드 구조 (조사 완료, 참고용)
- `MainController.java`(`GET /`, 27~77행)는 두 갈래로 나뉜다:
  - 상단: `@AuthenticationPrincipal CustomUserDetails userDetails`가 있으면(28~35행)
    `userKey`/`roles`/`isAdmin`을 모델에 담고 즉시 `return "main"`.
  - 하단: `userDetails`가 없고 `AUTH_TOKEN` 쿠키가 있으면(37~69행) 쿠키에서 직접
    `kakaoApiId`를 검증해 `userKey`를 조회하고 모델에 담은 뒤, 결국 74행을 지나
    `return "main"`(76행).
  - 쿠키 자체가 없으면(71~74행) `redirect:/login/kakao/login_callback`.
  - **두 갈래 모두 각자 "main"을 반환**하는 구조라, 자동이동 로직을 넣으려면 한 곳으로
    모아야 한다.
- 로그인 흐름: `login_callback.html`(`src/main/resources/templates/login_callback.html`)의
  `processKakaoCallback()`(79~101행)이 `POST /login/kakao` 성공 시 89행에서 **항상**
  `window.location.href = '/';`로 이동한다. 85행에서 `returnTo` 쿼리 파라미터를 읽어
  서버에 함께 전달하긴 하지만, 클라이언트 측 최종 리다이렉트는 `returnTo` 값과 무관하게
  하드코딩된 `'/'`이다. → **로그인 직후는 항상 `GET /`을 거친다.**
- "홈 화면 직접 접근"도 브라우저 주소창에 루트 URL을 입력하면 동일하게 `GET /`이므로,
  **"로그인 후"와 "홈 화면 직접 접근"은 코드상 동일한 진입점(`MainController.main()`)**
  이다. 이 한 곳에만 로직을 추가하면 두 요구사항이 함께 해결된다.
- "목록으로" 링크: `group.html:71`
  ```html
  <a th:href="@{/}" class="tab">목록으로</a>
  ```
  이 역시 `/`로 이동하므로, 자동이동 로직만 넣으면 "목록으로"를 눌러도 우선모임으로
  다시 튕겨나가는 회귀가 생긴다. 이 링크에서 온 요청만 구분할 방법이 필요하다.

## 요구사항
1. `group.html:71`의 "목록으로" 링크를 `th:href="@{/}"` → `th:href="@{/(list=1)}"`로
   바꿔 `/?list=1`로 이동하게 한다 — 자동이동을 우회하는 명시적 신호로 사용.
2. `MainController.main()`을 리팩터링해서, 상단(28~35행)·하단(37~74행) 두 갈래가 각자
   `return "main"`하는 대신 **userKey를 먼저 확정**하고 **공통 꼬리 로직 한 곳**에서
   자동이동 여부를 판단하도록 정리한다:
   - userKey가 존재하고, 요청에 `list=1` 파라미터가 없고,
     `userService.getUserByUserKey(userKey).getFavoriteGroupId()`가 null이 아니면
     `return "redirect:/groups/" + favoriteGroupId;`.
   - 그 외의 경우(`list=1`이 있거나, favoriteGroupId가 없거나, userKey 자체가 없는 경우)는
     기존과 동일하게 `return "main"`.
3. 로그인 콜백(`login_callback.html:89`)은 파라미터 없이 `/`로 이동하므로 별도 수정 없이
   새 자동이동 로직을 자연스럽게 타게 된다.

## 스코프 아님 (명시적으로 다루지 않음)
- 즐겨찾기 지정/해제 자체 — [favorite-group.md](favorite-group.md)의 스코프.
- `returnTo` 파라미터를 활용해 로그인 후 원래 보고 있던 페이지로 되돌아가는 기능 —
  현재 `login_callback.html`이 이 값을 서버에만 전달하고 클라이언트 리다이렉트에는 쓰지
  않는 기존 동작을 그대로 둔다(이번 작업에서 건드리지 않음).
- 우선모임 그룹에 대한 멤버십을 잃었거나 그룹이 사라진 경우의 예외 처리 — 컬럼 FK
  (`ON DELETE SET NULL`)와 `GroupViewController`의 기존 비회원 뷰 처리로 자연스럽게
  커버되며, 이 문서에서 추가 로직을 만들지 않는다.

## 검증 방법
1. 우선모임이 설정된 상태에서 `/login/test`로 재로그인 후 `/`으로 이동 →
   `/groups/{favoriteGroupId}`로 자동 리다이렉트되는지 확인.
2. 그룹 상세 화면에서 "목록으로" 클릭 → `/?list=1`로 이동해 자동 리다이렉트 없이 홈 화면
   (모임 목록)이 그대로 보이는지 확인.
3. 브라우저 주소창에 직접 `http://127.0.0.1:8081/`을 입력해 접근 → 우선모임으로 자동
   이동하는지 확인(로그인 상태 유지 중이어야 함).
4. 우선모임 미설정 상태에서는 로그인/홈 접근 시 기존처럼 홈 화면(모임 목록)이 그대로
   보이는지 확인(회귀 없음).
5. 비로그인 상태에서 `/` 접근 시 기존 동작(로그인 콜백 리다이렉트 등)이 그대로인지 확인.

## 진행 상태
- [ ] `group.html:71` "목록으로" 링크에 `list=1` 파라미터 추가
- [ ] `MainController.main()` — 공통 꼬리 로직으로 리팩터 + 자동이동 조건 추가
- [ ] 검증 방법 1~5 확인
