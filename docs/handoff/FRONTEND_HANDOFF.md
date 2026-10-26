# 프론트엔드 핸드오프 가이드

> 대상: `frontend/` 를 맡는 프론트엔드 개발자
> 기준: master `2034db2` (2026-10-26) — 백엔드 코드와 프론트 호출부를 직접 대조해 작성
> 백엔드 담당은 `backend/`·`deploy/`·DB 스키마를, 프론트엔드 담당은 `frontend/` 를 소유한다.

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 서비스 | 모임(클럽) 일정 관리 — 카카오 로그인, 모임 생성 신청·승인, 가입 요청, 일정·참가·출석, 알림 |
| 프론트 스택 | React 18 + TypeScript + Vite, TanStack Router(파일 라우트)/Query, Zustand, Tailwind v4, Vitest |
| 백엔드 | Spring Boot 3.4 + MyBatis + MariaDB, `/api/**` 만 응답(화면 서빙 없음) |
| 인증 | httpOnly `AUTH_TOKEN` 쿠키(JWT). 같은 출처 요청이면 자동 전송, 프론트는 토큰을 다루지 않는다 |
| 배포 | `master` push → GitHub Actions → web(nginx)·api 이미지 → dev.crewhub.store |
| 화면 현황 | 모든 화면 React 이전 완료(2026-10-25). 5개 라우트, 컴포넌트 테스트 포함 |

## 2. 시작하기

### 실행
```bash
scripts/bootrun-dev.sh &          # 백엔드 127.0.0.1:8080 (서버의 dev.env 필요)
cd frontend && npm ci && npm run dev   # http://127.0.0.1:5173, /api → 8080 프록시
```
- 개발은 서버(`~/workspace/club-schedule`)에서 하며, 브라우저는 SSH 터널로 본다:
  `ssh -L 5173:127.0.0.1:5173 ubuntu@<서버>` → `http://localhost:5173`. 상세: [DEV_SERVER.md](../DEV_SERVER.md)
- 백엔드 주소는 `BACKEND_URL` 환경변수로 바꿀 수 있다(`vite.config.ts`). 단 프록시가 `changeOrigin: false`
  라서 원격(dev.crewhub.store 등)을 대상으로 쓰려면 설정 조정이 필요하다 — 필요하면 백엔드 담당과 협의.
- `.npmrc` 의 `legacy-peer-deps` 때문에 피어 의존성이 자동 설치되지 않는다. 필요하면 직접 추가.

### 검사 (PR 전 필수)
```bash
cd frontend && npm run typecheck && npm test && npm run build
```
CI 는 아직 이 검사를 돌리지 않는다(이미지 빌드만 함). 로컬에서 반드시 통과시킨다.

### 테스트 로그인
`/login/test` 에서 계정을 고른다(`TEST_AUTH_SECRET` 이 설정된 환경에서만 동작, 운영에서는 꺼짐).

| kakaoApiId | 닉네임 | 실제 권한 |
|---|---|---|
| 9900000000001 ~ 003 | 관리자01~03 | 시스템 ADMIN → `/admin` 접근 가능 |
| 9900000000004 ~ 008 | 모임리더01~05 | 일반 USER (닉네임은 라벨일 뿐) |
| 9900000000009 ~ 018 | 모임매니저01~10 | 일반 USER (라벨) |
| 9900000000019 ~ 048 | 일반멤버01~30 | 일반 USER |

모임 안의 LEADER/MANAGER 권한은 **모임별 `group_member.role`** 로 정해진다. 리더 화면을 보려면 해당 계정이
실제 리더인 모임에 들어가야 한다(시드: `docs/test-data.sql`). 필요한 상태 데이터는 백엔드 담당에게 요청한다.

## 3. 코드 구조와 규약

```
src/routes/                   파일 기반 라우트 — 얇게 유지, routeTree.gen.ts 는 자동 생성(직접 수정·포맷 금지, 커밋 대상)
src/components/<Feature>/     atoms · molecules · organisms (아토믹 레이어)
src/components/common|layout/ 공용 UI, AppHeader·ModalHost
src/modules/api/<domain>/     axios 함수 (도메인별 인스턴스 + setupInterceptors)
src/modules/stores/server/<domain>/  TanStack Query queries.ts · mutations.ts
src/modules/stores/client/    Zustand createStore (modal, scheduleDialog)
src/types/                    API 응답·요청 타입 (백엔드 응답과 1:1)
src/utils/                    순수 함수 + 단위 테스트
```

규칙(요약 — 원문은 저장소 `CLAUDE.md` "프론트엔드" 절):
- API 는 같은 출처 `/api/**` 만 호출한다(쿠키 인증). 절대 URL·Authorization 헤더를 쓰지 않는다.
- React Compiler 활성 — `useMemo`/`useCallback`/`memo` 를 손으로 추가하지 않는다.
- 새 API 를 붙이는 순서: `types/` → `modules/api/<domain>` → `stores/server/<domain>` queries/mutations → 컴포넌트.
- 에러는 `ServerError {error, message}` 로 정규화되어 온다(`setupInterceptors.ts`). 아래 4장 주의사항 참고.
- 함수 이름 관례: 조회 `getX`, 생성 `createX`, 변경 `updateX`, 삭제 `deleteX`.

| URL | 화면 | 주 컴포넌트 |
|---|---|---|
| `/` | 내 모임 · 모임 검색 · 모임 생성 신청. 우선모임이 있으면 그 모임으로 이동(`?list=1` 이면 목록 유지) | `Group/*`, `GroupRequest/*` |
| `/groups/$groupId?tab=home\|schedule\|manage` | 홈(다가오는 일정) · 일정 달력 · 관리(가입요청·일정 승인·회원·권한) | `Schedule/*`, `Member/*`, `JoinRequest/*` |
| `/admin?tab=users\|groups\|groupRequests\|groupJoins` | 관리자 대시보드 | `Admin/*` |
| `/login/kakao/login_callback` | 카카오 콜백(카카오 콘솔 redirect URI — 경로 변경 금지) | `useKakaoCallback` |
| `/login/test` | 테스트 로그인 | `Auth/TestLoginForm` |

## 4. API 공통 계약 — 꼭 알아야 할 것

### 인증·권한
- 토큰 없이 허용되는 경로는 `/api/login/**` 뿐이다. **그 외 모든 API 는 로그인 필요**(미로그인 → JSON 401).
  `API.md` 에 "공개"로 적힌 엔드포인트(`/groups/recommended`, `/schedules`, `/members`)도 실제로는 401 을 준다.
- 401 → 로그인 안내(`LoginRequiredDialog`)는 프론트 책임이다.
- 관리자 API(`/api/admin/**`)는 `ROLE_ADMIN` 이 아니면 403. 화면 노출 여부는 `GET /api/auth/me` 의 `isAdmin` 으로 판단.
- 모임 안의 권한은 `GET /api/groups/{groupId}` 의 `viewer` 로 판단한다 — 화면에서 역할을 직접 계산하지 않는다.

```ts
viewer: { userKey, isLeader, isManager, isMember, canCreateSchedule, createNeedsApproval,
          canManageSchedule, isFavoriteGroup, hasFavoriteGroup }
visibilityType: 'PUBLIC' | 'PARTIAL' | 'PRIVATE'
```

| 기능 | 리더 | 매니저 | 멤버 | 비고 |
|---|:-:|:-:|:-:|---|
| 관리 탭 노출 | ✓ | ✓ | | `viewer.isManager` |
| 가입 요청 승인/거부 | ✓ | | | 백엔드가 리더만 허용(`isLeaderForRequest`) |
| 매니저 권한 프리셋 부여 | ✓ | | | 대상은 role=MANAGER 만 |
| 역할 변경·리더 승계 | ✓ | | | LEADER 지정 시 기존 리더는 MANAGER 로 |
| 내보내기/차단 | ✓ | ✓ | | 대상은 role=MEMBER 만(리더·매니저 불가) |
| 일정 승인/반려 | ✓ | 프리셋 | | `SCHEDULE_MANAGER` 프리셋 → `viewer.canManageSchedule` |
| 참가 승인/거부·출석 체크 | ✓ | 프리셋 | 일정 등록자 | `ATTENDANCE_MANAGER` 프리셋 |
| 참가 강제취소 | ✓ | ✓ | | 일정 등록자 단독으로는 불가 |
| 일정 등록 | 정책 | 정책 | 정책 | `viewer.canCreateSchedule`, 승인 필요 시 `createNeedsApproval` |

### 에러 응답 — 형태가 3가지다 (주의)
| 형태 | 예 | 프론트에서 보이는 값 |
|---|---|---|
| JSON `{error, message}` | 전역 예외 처리기, 가입 승인/거부, 그룹 상세 404 | 그대로 |
| 평문 문자열 본문 | 일정 생성 400/403(`"title은 필수입니다."`), 일정 수정 400, 역할 변경 400 | 인터셉터가 `{error:'Unknown', 기본 문구}` 로 바꿈 → **서버 문구 유실** |
| 빈 본문 | 다수의 401/403 (`ResponseEntity.status(403).build()`) — 역할·권한·차단·즐겨찾기 등 | `{error:'Unknown', 기본 문구}` |

→ 403/400 의 문구는 **상황별 문구를 화면에서 정한다**(`UNKNOWN_ERROR_CODE` 이면 대체 문구). 백엔드는 이를
`{error, message}` 로 통일하는 작업을 백로그에 두고 있다(7장).

### 데이터 형식
| 구분 | 형식 | 어디서 |
|---|---|---|
| 일정 시각 요청 | **epoch ms** (`start`, `end`) | `POST/PATCH .../schedules` |
| 일정 시각 응답 | epoch ms(`start`/`end`) + ISO LocalDateTime(`startAt`/`endAt`, 타임존 없음) | 일정 응답 |
| 일반 날짜 | ISO LocalDateTime `yyyy-MM-ddTHH:mm:ss` (타임존 없음, 서버 KST 기준) | 가입일·신청일 등 |
| 알림 `createdAt` | ISO Instant (`...Z`) | 알림 |
| 일정 요청 본문 키 | **snake_case** (`location_name`, `max_attendance`) + `content` | 일정 생성·수정 (응답은 `locationName`, `maxAttendance`, `description`) |
| 페이징 | `PagingResponse<T>` 1-based, 블록 5 | 관리자 목록 |

- 일정 수정에서 `max_attendance` 를 빼면 0(무제한)으로 덮어쓴다 — 수정 시 항상 현재 값을 보낸다.
- `maxAttendance: 0` = 인원 제한 없음. `confirmedCount`·`myAttendanceStatus` 는 CONFIRMED 일정에만 들어온다.

## 5. 엔드포인트 목록 (실제 코드 기준)

✓ = 프론트에서 사용 중, ✗ = 백엔드는 있으나 화면 없음

### 로그인·사용자
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | GET | `/api/auth/me` | `{userKey, nickname, roles, isAdmin, favoriteGroupId}` |
| ✓ | POST | `/api/login/kakao` | `{code, redirectUri, returnTo}` → 쿠키 + `{returnPath}` |
| ✓ | GET | `/api/login/test/accounts` | 테스트 인증 꺼지면 503 |
| ✓ | POST | `/api/login/test` | `{kakaoApiId}` |

> 로그아웃 API 는 없다(쿠키 만료까지 유지). 필요하면 백엔드에 요청.

### 모임
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | GET | `/api/groups/me` | 내 모임 |
| ✓ | GET | `/api/groups/recommended?q=` | q 없으면 최근 일정 기준 3개 |
| ✓ | GET | `/api/groups/{groupId}` | 모임 + `visibilityType` + `viewer` |
| ✗ | PATCH | `/api/groups/{groupId}` | **모임 정보 수정** — 매니저 이상. `{name, description, capacity(1~1000), autoApprove, schedulePolicy: ALL\|LEADERS_ONLY\|APPROVAL_REQUIRED}` 모두 선택. 검증 실패 400 `{error, message}` |
| ✓ | PUT / DELETE | `/api/groups/{groupId}/favorite` | 우선모임 지정/해제(지정은 멤버만, 아니면 403 빈 본문) |

### 모임 생성 신청 (`group_create_request`)
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | POST | `/api/group-requests` | `{groupName, description}` → `{requestId}`, 신청 불가 409 |
| ✓ | GET | `/api/group-requests` | 내 신청 목록 |
| ✓ | PATCH | `/api/group-requests/{requestId}/cancel` | 본인 취소 |

### 가입 요청 (`group_join_request` — 생성 신청과 별개)
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | POST | `/api/groups/{groupId}/join-requests` | 이미 멤버·중복 409, 차단 403 |
| ✓ | DELETE | `/api/groups/{groupId}/join-requests/{requestId}` | 본인 취소 |
| ✓ | GET | `/api/groups/{groupId}/join-requests/me` | 내 신청 |
| ✓ | GET | `/api/groups/joins/pending/{groupId}` | 대기 목록(리더 화면) |
| ✓ | PATCH | `/api/groups/joins/{requestId}/approve` | 리더만, `{ok}` |
| ✓ | PATCH | `/api/groups/joins/{requestId}/reject` | 리더만, `{rejectReason}` |

### 일정
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | GET | `/api/groups/{groupId}/schedules` | 전체 일정. **`from`, `to`(epoch ms) 기간 필터 지원 — 현재 미사용(✗)** |
| ✓ | POST | `/api/groups/{groupId}/schedules` | `{title*, start*, end, content, location_name, latitude, longitude, max_attendance}` |
| ✓ | PATCH | `/api/groups/{groupId}/schedules/{scheduleId}` | 위 필드 + `changeReason*` |
| ✓ | PATCH | `.../schedules/{scheduleId}/approve\|reject\|cancel` | 본문 없음(사유 미지원), 변경된 일정 반환 |

### 참가·출석
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | POST / DELETE | `.../schedules/{scheduleId}/attend` | 본인 참가 신청/취소 |
| ✓ | GET | `.../schedules/{scheduleId}/attendance` | 참가자(최신 상태) |
| ✓ | GET | `.../schedules/{scheduleId}/attendance/history` | 처리 이력 |
| ✓ | PATCH | `.../attendance/{targetUserKey}/approve\|reject` | |
| ✓ | DELETE | `.../attendance/{targetUserKey}` | 강제취소 |
| ✓ | PATCH | `.../attendance/{targetUserKey}/check` | `{actualStatus: ATTENDED\|NOSHOW}`, 일정 시작 이후만, 재호출로 정정 가능 |
| ✓ | GET | `/api/groups/{groupId}/attendance/roster?scheduleIds=1,2` | 팝오버용 일괄 명단 `{[scheduleId]: [{displayName,status}]}` |
| ✓ | GET | `/api/groups/{groupId}/attendance/me` | 내 참가 이력 |

### 회원 관리
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | GET | `/api/groups/{groupId}/members` | ACTIVE·WITHDRAWN·KICKED 모두, 매니저면 `presets` 포함 |
| ✓ | PATCH | `.../members/{userKey}/role` | `{role}` 리더만 |
| ✓ | PUT | `.../members/{userKey}/permissions` | `{presets: [SCHEDULE_MANAGER, ATTENDANCE_MANAGER]}` 리더만 |
| ✓ | PATCH / DELETE | `.../members/{userKey}/ban` | 내보내기·차단 `{reason}` / 차단 해제 |

### 알림
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | GET | `/api/notifications?limit=` | 최근 N건(1~30), 페이지네이션 없음 |
| ✓ | GET | `/api/notifications/unread-count` | `{count}` |
| ✓ | PATCH | `/api/notifications/{notificationId}/read` | 멱등 |
| ✓ | PATCH | `/api/notifications/read-all` | `{updated}` |

> 실시간 푸시·폴링 없음 — 페이지 로드·벨 열 때 조회한다. `targetUrl` 은 `/groups/{id}` 까지만(일정 딥링크 없음).

### 관리자 (`ROLE_ADMIN`)
| | Method | Path | 비고 |
|:-:|---|---|---|
| ✓ | GET | `/api/admin/users\|groups\|group-joins?page=&size=&q=` | `PagingResponse` |
| ✓ | GET | `/api/admin/group-requests?page=&size=&status=&q=` | |
| ✓ | POST | `/api/admin/group-requests/{requestId}/approve\|reject` | reject 는 `{rejectReason}` 필수 |
| ✓ | POST | `/api/admin/group-joins/{requestId}/approve\|reject` | |

> 관리자 검색은 키워드(`q`)와 생성 신청 `status` 만 지원한다. 권한·기간 필터는 API 미지원.

## 6. 프론트 작업 백로그

### 바로 착수 가능 (백엔드 준비 완료)
| # | 작업 | 사용 API | 메모 |
|---|---|---|---|
| F1 | **모임 정보 수정 화면** (관리 탭) | `PATCH /api/groups/{groupId}` | 이름·설명·정원·가입 자동승인·일정 등록 정책. 매니저 이상 노출. 성공 후 그룹 상세 쿼리 무효화 |
| F2 | 일정 조회를 달력 기간 기준으로 | `GET .../schedules?from=&to=` | 현재 모든 일정을 한 번에 받음 — 모임 일정이 늘면 필요. 쿼리 키에 기간 포함 |
| F3 | 에러 문구 점검 | — | 4장 표의 빈 본문/평문 응답 지점에 상황별 대체 문구가 있는지 확인 |
| F4 | 프론트 검사 CI | `.github/workflows/deploy.yml` | typecheck·test 단계 추가(워크플로 수정은 백엔드 담당과 함께 리뷰) |

### 백엔드 선행 필요 (API 확정 후 진행)
| # | 기능 | 상태 |
|---|---|---|
| B1 | 자진 탈퇴(본인 WITHDRAWN) | API 없음 |
| B2 | 일정 반려·취소 사유 입력 | API 가 본문을 받지 않음 — 추가되면 `ReasonDialog` 재사용 |
| B3 | 모임별 닉네임 | 스키마 변경 필요(`group_member.nickname`) |
| B4 | 내 모임 통합 캘린더 | API 없음(보류 상태) |
| B5 | 관리자 검색 필터(권한·기간) | API·매퍼 미지원 |
| B6 | 로그아웃 | API 없음 |
| B7 | 알림 → 일정 상세 딥링크 | 응답에 scheduleId 기반 링크 없음 |

백엔드가 API 를 추가하면 이 문서의 5장과 `docs/API.md` 를 같은 PR 에서 갱신한다.

## 7. 알려진 이슈 (백엔드 측, 공유용)

| 이슈 | 영향 | 담당 |
|---|---|---|
| `GET /api/groups/joins/pending/{groupId}` 에 모임 권한 검사가 없다 — 로그인만 하면 다른 모임의 대기 목록 조회 가능 | 보안. 화면 동작에는 영향 없음 | 백엔드 |
| `/api/debug/whoami` 가 남아 있다 | 운영 전 제거 필요 | 백엔드 |
| 에러 본문 형태 불일치(4장) | 서버 문구가 화면에 안 나옴 | 백엔드 — 통일 후 공지 |
| `docs/API.md` 일부가 실제와 다름(“공개” 표기, 누락된 엔드포인트) | 이 문서 5장을 우선한다 | 백엔드 |
| CI 에 검사 단계·동시 배포 방지 없음 | 깨진 빌드가 배포될 수 있음 | 공동 |

## 8. 협업 방식

- **브랜치**: `feat/<영역>-<내용>`, `fix/...` → PR → `master`. `master` 병합 즉시 dev 에 배포되므로 PR 은 작게.
- **API 계약 변경**: 백엔드가 응답 형태·경로를 바꿀 때는 PR 설명에 "프론트 영향"을 적고 이 문서와 `API.md` 를 같이
  갱신한다. 프론트가 새 API 가 필요하면 요청 형태 초안(경로·요청·응답 예시)을 이슈로 먼저 올린다.
- **타입 동기화**: `src/types/*` 는 백엔드 응답과 1:1 이다. 응답이 바뀌면 타입부터 고친다.
- **데이터 요청**: 특정 상태(리더 계정, PENDING 일정 등)가 필요하면 백엔드 담당에게 dev DB 시드를 요청한다.
  dev DB 를 직접 수정하지 않는다.
- **공유 파일**: `deploy/`, `.github/workflows/`, `frontend/Dockerfile`·`nginx.conf` 변경은 양쪽 리뷰.

## 9. 첫 주 체크리스트

- [ ] 서버 접속·SSH 터널로 `npm run dev` 화면 확인
- [ ] 관리자01·일반멤버01 로 각각 로그인해 5개 화면 둘러보기
- [ ] `npm run typecheck && npm test && npm run build` 통과 확인
- [ ] 이 문서 4장(에러·날짜·snake_case)과 `CLAUDE.md` 프론트엔드 절 읽기
- [ ] F1(모임 정보 수정) 화면 착수

참고 문서: [API.md](../API.md) · [DATABASE.md](../DATABASE.md)(참가·차단 규칙) · [DEV_SERVER.md](../DEV_SERVER.md) ·
[ROADMAP.md](../ROADMAP.md) · [OPERATIONS.md](../OPERATIONS.md)
