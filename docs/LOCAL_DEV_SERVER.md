# 로컬 개발 서버 구동 방법

로컬 PC(Windows)에서 백엔드 서버를 띄우고 개발 서버(dev.crewhub.store)의 DB(`app_dev`)에 붙여 개발하는 절차를 정리한다.

## 전체 구조

```
[로컬 PC]                          [Ubuntu 원격 호스트: www.crewhub.store]
gradlew bootRun (8081)                mariadb-dev 컨테이너 (app-network)
   │ jdbc:mariadb://127.0.0.1:3307      │ 127.0.0.1:3307 로 publish
   └── SSH 터널(로컬 3307) ────────────┘
```

- 로컬 Spring Boot 앱은 항상 `127.0.0.1:3307`(로컬 포트)로 DB에 접속한다.
- 실제 `mariadb-dev` 컨테이너는 원격 Ubuntu 호스트에서 `127.0.0.1:3307`로 publish 되어 있다(3306은 `mariadb-prod`가 사용 중이므로 혼동하면 안 됨).
- 따라서 로컬 3307 → SSH 터널 → 원격 3307 → `mariadb-dev` 컨테이너 순으로 연결된다.

## 사전 준비물

| 항목 | 위치 | 비고 |
|------|------|------|
| SSH 개인키 | `C:\ORACLE-ARM-SERVER\ssh-key-2026-07-21.key` | 원격 Ubuntu 호스트 접속용 |
| DB 접속 정보 | `src/main/resources/application-private.properties` | git 제외 대상. 없으면 `application-private.properties.example`을 복사해서 값 채우기 |

`application.properties`에 `spring.profiles.include=private`가 설정되어 있어 `application-private.properties`는 별도 프로필 지정 없이 자동으로 로드된다.

## 절차

### 1. DB SSH 터널 열기

```powershell
.\scripts\start-db-tunnel.ps1 -SshHost ubuntu@www.crewhub.store -LocalPort 3307 -RemotePort 3307 -IdentityFile "C:\ORACLE-ARM-SERVER\ssh-key-2026-07-21.key"
```

- 이 명령은 포그라운드로 SSH 세션을 물고 있는 방식(`-N` 옵션)이라 별도 터미널 창에서 계속 띄워둬야 한다. 서버를 구동하는 터미널과는 별개로 실행할 것.
- 정상 연결되면 로컬에서 `netstat -an | grep 3307`로 `127.0.0.1:3307 LISTENING`이 보인다.
- 연결 종료(Ctrl+C) 시 이후 앱의 DB 쿼리는 모두 실패한다.

### 2. Spring Boot 앱 구동

Eclipse를 쓰는 경우 Spring Boot 앱을 Run/Debug로 실행하면 된다(포트 8081).

CLI(Gradle Wrapper)로 구동하려면:

```powershell
.\gradlew bootRun
```

- `build.gradle`을 최근에 변경했다면(`-parameters` 플래그 등) Eclipse에서 **우클릭 → Gradle → Refresh Gradle Project**를 먼저 해야 반영된다. `gradlew` CLI 실행은 매번 새로 컴파일하므로 이 문제와 무관하다.
- 기동 로그에서 `Started MoyoraClubScheduleApplication in N seconds`가 뜨면 정상 기동이다.
- 실패 시 `APPLICATION FAILED TO START`, `Web server failed to start`(포트 충돌), `Error creating bean`(주로 DB 연결 실패 — 터널이 안 열려 있는 경우가 대부분) 메시지를 확인한다.
- ⚠️ **템플릿/정적 리소스(`src/main/resources/templates`, `static`)를 수정한 뒤에는 `bootRun`을 껐다가 다시 켜야 반영된다.** `spring.thymeleaf.cache=false`는 파싱 결과 캐시만 끌 뿐, 서버는 기동 시점에 `build/resources`로 복사된 스냅샷을 계속 서빙한다. 실행 중인 프로세스를 그대로 두고 `.html`/`.js`만 고치면 브라우저를 아무리 새로고침해도 예전 내용이 나온다.

### 3. 접속 확인

- 앱: `http://127.0.0.1:8081`
- 테스트 로그인: `http://127.0.0.1:8081/login/test` 에서 계정 선택 → 내부적으로 `POST /login/test` (`{"kakaoApiId": ...}`) 호출
  - 테스트 계정 범위 및 역할 구분은 `CLAUDE.md` 참고

## 트러블슈팅

| 증상 | 원인 | 조치 |
|------|------|------|
| `Error creating bean ... DataSource` | SSH 터널 미연결 | 1단계 터널 명령 다시 실행, `netstat`으로 3307 리스닝 확인 |
| DB는 붙는데 데이터가 이상함 | 3306(=`mariadb-prod`)으로 잘못 터널링 | `RemotePort`가 반드시 `3307`인지 확인 (3306 아님) |
| 컨트롤러 파라미터 바인딩 500 오류 | `build.gradle`의 `-parameters` 플래그가 컴파일에 미반영 | Eclipse: Gradle Refresh 수행 / CLI(`gradlew`): 재빌드하면 자동 반영 |
| 포트 8081 already in use | 기존 서버 프로세스가 남아 있음 | 기존 프로세스 종료 후 재기동 |
| 화면(html/js)을 고쳤는데 브라우저에 반영 안 됨 | `bootRun` 프로세스가 기동 시점 리소스 스냅샷을 계속 서빙 중 | 서버 재시작(2단계 다시 실행) |

## 관련 문서

- `CLAUDE.md` — 로컬 개발 환경, 테스트 계정 정보
- `docs/DATABASE.md` — 스키마 및 마이그레이션 이력
- `scripts/start-db-tunnel.ps1` — 터널 스크립트 원본
