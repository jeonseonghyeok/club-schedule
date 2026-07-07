# 데이터베이스 스키마 (초안, MariaDB 기준)

이 문서는 `src/main/java/com/moyora/clubschedule/vo/`의 VO들을 기반으로 작성한 데이터베이스 테이블 정의 초안입니다. 요청에 따라 MariaDB(MariaDB/MySQL) 문법과 한글 주석을 포함한 SQL 생성 쿼리를 반영했습니다.

주요 가정 및 규칙
- 타겟 DB: MariaDB / MySQL (InnoDB, utf8mb4)
- Java 타입 매핑(권장)
  - Long -> BIGINT
  - Integer -> INT
  - String -> VARCHAR(n) 또는 TEXT
  - Boolean -> TINYINT(1)
  - java.time.LocalDateTime / java.util.Date -> DATETIME
- 문서에 포함된 CREATE TABLE 문은 제공하신 MariaDB 쿼리를 그대로 사용했습니다. 필요한 경우 제약이나 인덱스를 더 보강할 수 있습니다.
- 아래 스키마는 [`migration_v2.sql`](migration_v2.sql)(처리자 컬럼 표준화 + `group_schedule_history` 신설), [`migration_v3.sql`](migration_v3.sql)(`schedule_attendance_check_history` 신설) 적용 이후 기준입니다. 코드(`ScheduleAttendanceVo` 등)도 이 컬럼명을 사용합니다.

---

아래는 제공하신 MariaDB용 생성 쿼리 모음입니다 (원문 그대로 포함, 테이블별 한국어 주석 포함).

-- club_schedule.notification definition

CREATE TABLE `notification` (
  `notification_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_key` bigint(20) unsigned NOT NULL,
  `source_table` enum('GROUP_CREATE_REQUEST','GROUP_JOIN_REQUEST','SCHEDULE') NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `category` enum('APPROVE','REJECT','NOTICE') NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- club_schedule.`user` definition

CREATE TABLE `user` (
  `user_key` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '사용자 키',
  `kakao_api_id` bigint(20) unsigned NOT NULL DEFAULT 0 COMMENT '카카오API ID',
  `nickname` varchar(100) DEFAULT NULL COMMENT '닉네임',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '가입일시',
  `referrer_url` varchar(100) DEFAULT NULL COMMENT '유입 경로 URL',
  `system_role` enum('USER','ADMIN') NOT NULL DEFAULT 'USER' COMMENT '시스템 내 역할',
  PRIMARY KEY (`user_key`),
  UNIQUE KEY `user_unique` (`kakao_api_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1000005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- club_schedule.`group` definition

CREATE TABLE `group` (
  `group_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '모임그룹 키',
  `name` varchar(100) NOT NULL COMMENT '모임 이름',
  `description` text NOT NULL COMMENT '모임 설명',
  `leader_user_key` bigint(20) unsigned NOT NULL COMMENT '리더 유저 키',
  `capacity` int(10) unsigned NOT NULL DEFAULT 50 COMMENT '정원 (기본 50명)',
  `auto_approve` tinyint(1) NOT NULL DEFAULT 0 COMMENT '회원 자동 승인 여부 (0: 수동, 1 : 자동)',
  `allow_self_nickname` tinyint(1) NOT NULL DEFAULT 1 COMMENT '멤버 본인의 별명 직접 수정 허용 여부',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `group_create_request_id` bigint(20) NOT NULL COMMENT '모입그룹 요청 키',
  `schedule_policy` enum('ALL','LEADERS_ONLY','APPROVAL_REQUIRED') NOT NULL DEFAULT 'ALL' COMMENT '일정 등록 권한 정책 (누구나/리더급만/승인후등록)',
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `group_unique` (`group_create_request_id`),
  KEY `idx_leader` (`leader_user_key`),
  CONSTRAINT `fk_leader_user` FOREIGN KEY (`leader_user_key`) REFERENCES `user` (`user_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_create_request definition

CREATE TABLE `group_create_request` (
  `request_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '요청 키',
  `user_key` bigint(20) unsigned NOT NULL COMMENT '요청자 (user 테이블 참조)',
  `group_name` varchar(100) NOT NULL COMMENT '모임 이름',
  `description` text DEFAULT NULL COMMENT '모임 설명',
  `requested_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '신청일시',
  `status` enum('PENDING','PROCESSING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT '신청 상태',
  `reject_reason` text DEFAULT NULL COMMENT '거절 사유',
  `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT '마지막 상태 변경자 (migration_v2: updated_by_user_key → updated_by)',
  `status_updated_at` datetime DEFAULT NULL COMMENT '상태 변경일시',
  PRIMARY KEY (`request_id`),
  KEY `idx_user_key` (`user_key`),
  CONSTRAINT `fk_request_user` FOREIGN KEY (`user_key`) REFERENCES `user` (`user_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_join_ban definition

CREATE TABLE `group_join_ban` (
  `group_id` bigint(20) unsigned NOT NULL COMMENT '모임그룹 키',
  `user_key` bigint(20) unsigned NOT NULL COMMENT '금지된 유저 키',
  `banned_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '금지 일시',
  `banned_by_user_key` bigint(20) unsigned DEFAULT NULL COMMENT '밴 처리한 사용자 키',
  `reason` text DEFAULT NULL COMMENT '금지 사유',
  PRIMARY KEY (`group_id`,`user_key`),
  KEY `fk_ban_user` (`user_key`),
  KEY `fk_ban_operator` (`banned_by_user_key`),
  CONSTRAINT `fk_ban_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ban_operator` FOREIGN KEY (`banned_by_user_key`) REFERENCES `user` (`user_key`) ON DELETE SET NULL,
  CONSTRAINT `fk_ban_user` FOREIGN KEY (`user_key`) REFERENCES `user` (`user_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_join_request definition

CREATE TABLE `group_join_request` (
  `request_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '가입 요청 키',
  `group_id` bigint(20) unsigned NOT NULL COMMENT '모임그룹 키',
  `user_key` bigint(20) unsigned NOT NULL COMMENT '요청자',
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT '승인 상태',
  `requested_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '요청일시',
  `approved_at` datetime DEFAULT NULL COMMENT '승인일시',
  `reject_reason` text DEFAULT NULL COMMENT '거절 사유',
  `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT '가입 승인/거부 처리자 (자동 승인 시 NULL) — migration_v2 추가',
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `uniq_group_user` (`group_id`,`user_key`),
  KEY `fk_joinreq_user` (`user_key`),
  CONSTRAINT `fk_joinreq_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_joinreq_user` FOREIGN KEY (`user_key`) REFERENCES `user` (`user_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_member definition

CREATE TABLE `group_member` (
  `group_id` bigint(20) unsigned NOT NULL COMMENT '모임그룹 키',
  `user_key` bigint(20) unsigned NOT NULL COMMENT '회원 유저 키',
  `role` enum('LEADER','MANAGER','MEMBER') NOT NULL DEFAULT 'MEMBER' COMMENT '역할 (LEADER > MANAGER > MEMBER 3단계)',
  `status` enum('ACTIVE','WITHDRAWN','KICKED') NOT NULL DEFAULT 'ACTIVE' COMMENT '회원 상태',
  `joined_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '참여일시',
  `left_at` datetime DEFAULT NULL COMMENT '탈퇴/강퇴 일시',
  `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT '강퇴·역할변경 처리자 (본인 탈퇴 시 본인, 강퇴 시 처리자) — migration_v2 추가',
  PRIMARY KEY (`group_id`,`user_key`),
  KEY `fk_member_user` (`user_key`),
  CONSTRAINT `fk_member_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_key`) REFERENCES `user` (`user_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_member_permission definition
-- MANAGER 개인에게 그룹 정책(group_schedule_policy)의 기본값을 덮어쓰는 예외 권한(Override)을 부여할 때 사용.
-- is_allowed=1: 명시적 허용, is_allowed=0: 명시적 차단. 행이 없으면 그룹 정책의 기본값을 따른다.

CREATE TABLE `group_member_permission` (
  `group_id` bigint(20) unsigned NOT NULL,
  `user_key` bigint(20) unsigned NOT NULL,
  `permission_type` enum('CREATE_SCHEDULE_DIRECT','MANAGE_SCHEDULE','MANAGE_MEMBER','MANAGE_NICKNAME','MANAGE_NOTICE') NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1: 허용, 0: 차단 (그룹 정책보다 최우선 적용)',
  `granted_by_user_key` bigint(20) unsigned DEFAULT NULL COMMENT '권한 부여 주체 (migration_v2: granted_by → granted_by_user_key)',
  `granted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp() COMMENT '권한 수정 일시',
  PRIMARY KEY (`group_id`,`user_key`,`permission_type`),
  KEY `fk_perm_granted_by` (`granted_by_user_key`),
  CONSTRAINT `fk_perm_granted_by` FOREIGN KEY (`granted_by_user_key`) REFERENCES `user` (`user_key`) ON DELETE SET NULL,
  CONSTRAINT `fk_perm_member` FOREIGN KEY (`group_id`, `user_key`) REFERENCES `group_member` (`group_id`, `user_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_schedule definition

CREATE TABLE `group_schedule` (
  `schedule_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '스케줄 고유 키',
  `group_id` bigint(20) unsigned NOT NULL COMMENT '소속 그룹 키',
  `title` varchar(100) NOT NULL COMMENT '일정 제목',
  `content` text DEFAULT NULL COMMENT '일정 상세 내용',
  `location_name` varchar(255) DEFAULT NULL COMMENT '장소 명칭 (예: 강남역 스터디룸)',
  `latitude` decimal(10,8) DEFAULT NULL COMMENT '위도',
  `longitude` decimal(11,8) DEFAULT NULL COMMENT '경도',
  `start_at` datetime NOT NULL COMMENT '모임 시작 시간',
  `end_at` datetime DEFAULT NULL COMMENT '모임 종료 시간',
  `max_attendance` int(10) unsigned DEFAULT 0 COMMENT '최대 인원 제한 (0: 무제한)',
  `status` enum('PENDING','CONFIRMED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING: 승인대기, CONFIRMED: 확정, REJECTED: 반려, CANCELLED: 취소',
  `created_by` bigint(20) unsigned NOT NULL COMMENT '작성자 (user_key)',
  `approved_by_user_key` bigint(20) unsigned DEFAULT NULL COMMENT '승인/반려 처리자 (user_key) — migration_v2: approved_by → approved_by_user_key',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_completed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '방장에 의한 최종 종료 및 정산 여부',
  `completed_at` datetime DEFAULT NULL COMMENT '실제 종료 처리 시점',
  PRIMARY KEY (`schedule_id`),
  KEY `idx_group_start_at` (`group_id`,`start_at`),
  KEY `fk_schedule_creator` (`created_by`),
  CONSTRAINT `fk_schedule_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`user_key`),
  CONSTRAINT `fk_schedule_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_schedule_policy definition
-- 그룹 단위 일정 관련 기본 정책. group_member_permission에 개인 예외 행이 없는 경우 이 값을 따른다.

CREATE TABLE `group_schedule_policy` (
  `group_id` bigint(20) unsigned NOT NULL COMMENT '그룹 키',
  `min_role_to_create` enum('LEADER','MANAGER','MEMBER') NOT NULL DEFAULT 'MEMBER' COMMENT '일정 등록 허용 최소 역할 (LEADER: 리더만, MANAGER: 매니저 이상, MEMBER: 전체)',
  `requires_approval` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'MEMBER 등록 시 승인 필요 여부 (0: 즉시 CONFIRMED, 1: PENDING→승인)',
  `def_manager_can_manage_schedule` tinyint(1) NOT NULL DEFAULT 1 COMMENT '매니저 기본 일정 관리 권한 (승인·반려·취소). 개인 예외가 없을 때 이 값 사용.',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `requires_attendance_approval` tinyint(1) NOT NULL DEFAULT 0 COMMENT '참석 신청 시 승인 필요 여부 (0: 즉시확정, 1: 승인대기)',
  `visibility_type` enum('PUBLIC','PARTIAL','PRIVATE') NOT NULL DEFAULT 'PARTIAL' COMMENT '일정 공개 범위 (PUBLIC: 전체공개, PARTIAL: 일부공개(3일), PRIVATE: 멤버만)',
  `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT '정책 마지막 변경자 — migration_v2 추가',
  PRIMARY KEY (`group_id`),
  CONSTRAINT `fk_policy_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.schedule_attendance definition (migration_v4 적용 후 기준)

CREATE TABLE `schedule_attendance` (
  `attendance_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `schedule_id` bigint(20) unsigned NOT NULL COMMENT '스케줄 키',
  `user_key` bigint(20) unsigned NOT NULL COMMENT '유저 키',
  `status` enum('PENDING','CONFIRMED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING: 신청대기, CONFIRMED: 참여확정, REJECTED: 거절, CANCELLED: 본인취소',
  `is_latest` tinyint(1) NOT NULL DEFAULT 1 COMMENT '현재 유효한 최신 상태 여부 (0: 과거이력, 1: 최신)',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '신청/변경 시점(= 해당 상태 행이 생성된 시각) — migration_v4: applied_at → created_at',
  `processed_by_user_key` bigint(20) unsigned DEFAULT NULL COMMENT '승인/거절 처리 주체(본인 또는 관리자) — migration_v2: processed_by → processed_by_user_key',
  `updated_by` bigint(20) unsigned DEFAULT NULL COMMENT '상태를 마지막으로 변경한 유저 키 — migration_v2 추가',
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp() COMMENT '상태 변경 일시 — migration_v2 추가',
  `actual_status` enum('ATTENDED','NOSHOW','NONE') NOT NULL DEFAULT 'NONE' COMMENT '실제 참석 결과 (ATTENDED: 출석, NOSHOW: 결석, NONE: 체크전)',
  `checked_at` datetime DEFAULT NULL COMMENT '출석 체크 완료 시점',
  `checked_by_user_key` bigint(20) unsigned DEFAULT NULL COMMENT '출석 체크한 관리자 — migration_v2: checked_by → checked_by_user_key',
  PRIMARY KEY (`attendance_id`),
  KEY `idx_schedule_user_latest` (`schedule_id`,`user_key`,`is_latest`),
  CONSTRAINT `fk_attendance_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `group_schedule` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user` (`user_key`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.group_schedule_history definition (migration_v2 신규 테이블)
-- 일정 수정 이력. 수정 전 값을 스냅샷으로 보존

CREATE TABLE `group_schedule_history` (
  `history_id`     bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `schedule_id`    bigint(20) unsigned NOT NULL,
  `group_id`       bigint(20) unsigned NOT NULL,
  `changed_by`     bigint(20) unsigned NOT NULL COMMENT '수정한 유저 키',
  `change_reason`  varchar(500)        NOT NULL COMMENT '변경 사유 (필수)',
  `title`          varchar(100)        DEFAULT NULL,
  `content`        text                DEFAULT NULL,
  `location_name`  varchar(255)        DEFAULT NULL,
  `latitude`       decimal(10,8)       DEFAULT NULL,
  `longitude`      decimal(11,8)       DEFAULT NULL,
  `start_at`       datetime            DEFAULT NULL,
  `end_at`         datetime            DEFAULT NULL,
  `max_attendance` int(10) unsigned    DEFAULT NULL,
  `status`         enum('PENDING','CONFIRMED','REJECTED','CANCELLED') DEFAULT NULL,
  `changed_at`     datetime            NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `idx_history_schedule` (`schedule_id`),
  CONSTRAINT `fk_history_schedule` FOREIGN KEY (`schedule_id`)
    REFERENCES `group_schedule` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_changer` FOREIGN KEY (`changed_by`)
    REFERENCES `user` (`user_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- club_schedule.schedule_attendance_check_history definition (migration_v3 신규 테이블)
-- 출석 체크(actual_status) 정정 이력. 매 체크/재체크마다 변경 전후 값을 기록

CREATE TABLE `schedule_attendance_check_history` (
  `history_id`             bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attendance_id`          bigint(20) unsigned NOT NULL COMMENT '대상 참가 신청 키',
  `schedule_id`            bigint(20) unsigned NOT NULL COMMENT '스케줄 키 (조회 편의용 비정규화)',
  `user_key`               bigint(20) unsigned NOT NULL COMMENT '출석 체크 대상 유저 키',
  `previous_actual_status` enum('NONE','ATTENDED','NOSHOW') NOT NULL COMMENT '변경 전 값',
  `new_actual_status`      enum('NONE','ATTENDED','NOSHOW') NOT NULL COMMENT '변경 후 값',
  `changed_by`             bigint(20) unsigned NOT NULL COMMENT '정정 처리자 (일정 생성자/매니저/리더)',
  `change_reason`          varchar(500)         DEFAULT NULL COMMENT '정정 사유 (최초 체크 시 NULL 허용)',
  `changed_at`             datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `idx_check_history_attendance` (`attendance_id`),
  CONSTRAINT `fk_check_history_attendance` FOREIGN KEY (`attendance_id`)
    REFERENCES `schedule_attendance` (`attendance_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_check_history_changer` FOREIGN KEY (`changed_by`)
    REFERENCES `user` (`user_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


---

## 역할 구조 및 일정 권한 검증 규칙

### 역할 등급 (group_member.role)

| 역할 | 설명 |
|------|------|
| `LEADER` | 그룹 최고 관리자. 모든 권한 보유. |
| `MANAGER` | 부관리자. 그룹 정책 또는 개인 예외 권한에 따라 일정·멤버 관리 가능. |
| `MEMBER` | 일반 멤버. 그룹 정책이 허용하는 범위 내에서 일정 등록 가능. |

> LEADER는 MANAGER의 상위 등급이므로, `isManager` 판단 시 LEADER이면 자동으로 true.

---

### 일정 권한 검증 우선순위

권한 판단은 아래 순서로 처리되며, 앞 단계에서 결론이 나면 이후 단계는 건너뜁니다.

```
1순위 — 유저별 예외 권한 (group_member_permission)
  └─ 해당 유저·그룹·권한 타입으로 행이 존재하면
       is_allowed=1 → 허용 / is_allowed=0 → 차단 (즉시 결론)

2순위 — 그룹 정책 (group_schedule_policy)
  ├─ 일정 등록:  min_role_to_create 등급과 유저 역할 비교
  │    LEADER만 → MANAGER·MEMBER 차단
  │    MANAGER 이상 → MEMBER 차단
  │    MEMBER 이상(기본) → 전체 허용
  └─ 일정 관리(승인·반려·취소):  def_manager_can_manage_schedule 값
       1(기본) → MANAGER 허용 / 0 → MANAGER 차단
```

#### 일정 등록 시 초기 status 결정

| 역할 | 조건 | 초기 status |
|------|------|-------------|
| LEADER | 항상 | `CONFIRMED` |
| MANAGER | `CREATE_SCHEDULE_DIRECT` 예외 허용 행 있음 | `CONFIRMED` |
| MANAGER | 예외 없음 | `PENDING` |
| MEMBER | `min_role_to_create` 허용 + `requires_approval=0` | `CONFIRMED` |
| MEMBER | `min_role_to_create` 허용 + `requires_approval=1` | `PENDING` |
| MEMBER | `min_role_to_create` 미달 | 403 차단 |

---

## 출석 관리 규칙

`schedule_attendance` 테이블 기반. API는 [API.md — 출석 관리 API](API.md#출석-관리-api) 참고.

**참가신청 자동 승인 규칙** (`group_schedule_policy.requires_attendance_approval` 기준)

| 신청자 역할 | requiresAttendanceApproval=false | requiresAttendanceApproval=true |
|------------|----------------------------------|----------------------------------|
| LEADER     | 즉시 CONFIRMED                   | 즉시 CONFIRMED                  |
| MANAGER    | 즉시 CONFIRMED                   | 즉시 CONFIRMED                  |
| MEMBER     | 즉시 CONFIRMED                   | PENDING (수동 승인 필요)         |

**`is_latest` 상태 전이 규칙 — 신청/승인/거부/취소 전부 새 행 INSERT**

신청뿐 아니라 승인·거부·본인취소·강제취소도 전부 "기존 `is_latest=1` 행을 `is_latest=0`으로
무효화하고 새 행을 INSERT"하는 동일한 패턴을 따른다(과거에는 승인/거부/취소가 기존 행을
UPDATE로 덮어써서 중간 이력이 소실됐으나, 이제는 그렇지 않다). 새 컬럼이나 별도 이력
테이블 없이, **`status` 값 자체가 그 행이 어떤 액션으로 생성됐는지를 의미**한다 —
`PENDING`은 오직 신청(승인 대기)으로만 생성되고, `CONFIRMED`는 신청 시 즉시 확정되었거나
승인되어 생성되며, `REJECTED`는 거부로, `CANCELLED`는 취소(본인 또는 강제)로만 생성된다.
본인취소와 강제취소는 `updated_by`가 `user_key`(본인)와 같은지 다른지로 구분한다.

- 참가자 목록(신청 탭) 조회: `WHERE schedule_id=? AND is_latest=1` (기존과 동일, PENDING/CONFIRMED만 노출)
- 이력 조회: `WHERE schedule_id=?` (`is_latest` 조건 없이 전체 행을 `created_at` 순으로) —
  `GET /api/groups/{groupId}/schedules/{scheduleId}/attendance/history`
  ([API.md](API.md#출석-관리-api) 참고). 같은 사용자가 신청→승인→취소→신청→거부처럼 여러
  사이클을 거치면 각 사이클마다 다른 `attendance_id`로 별도 행이 남아 전부 이력에 보인다.

**참가 취소 규칙**

| 취소 주체 | 조건 |
|----------|------|
| 본인 | 일정 `start_at` 이전까지 |
| MANAGER 이상 (강제 취소) | 일정 `start_at` 이전까지. **일정 등록자라도 MANAGER 이상이 아니면 강제취소 불가**(승인/거부보다 좁은 권한) |
| 누구도 | 일정 시작 후 불가 (409) |

---

## 출석 체크 정정 이력

`schedule_attendance_check_history` 테이블 기반 (`migration_v3.sql`). API는 [API.md — 출석 관리 API](API.md#출석-관리-api)의 `PATCH .../check` 참고.

- **정정 가능**: 출석 체크(`actual_status`)는 최초 체크 이후에도 재호출로 정정할 수 있다. 매 호출마다 변경 전/후 값을 이 테이블에 스냅샷으로 남긴다.
- **권한**: 참가 승인/거부/강제취소와 동일하게 **일정 생성자 또는 MANAGER 이상**(LEADER 포함)이면 허용. `schedule_attendance`의 `checked_by_user_key`/`checked_at`은 최신 값만 반영하고, 과거 값과 변경자·변경사유 이력은 이 테이블에서 조회한다.
- `group_schedule_history`(일정 수정 이력)와 동일한 스냅샷 패턴을 따른다.

---

## 간단한 설명 및 Mermaid ERD

아래 ERD는 위 테이블들(주요 테이블 기준)의 관계를 요약한 다이어그램입니다.

```mermaid
erDiagram
    `user` {
        BIGINT user_key PK
        BIGINT kakao_api_id
        VARCHAR nickname
        DATETIME created_at
        VARCHAR referrer_url
        ENUM system_role
    }

    `group` {
        BIGINT group_id PK
        VARCHAR name
        TEXT description
        BIGINT leader_user_key FK
        INT capacity
        TINYINT auto_approve
        TINYINT allow_self_nickname
        DATETIME created_at
        DATETIME updated_at
        BIGINT group_create_request_id FK
        ENUM schedule_policy
    }

    group_member {
        BIGINT group_id FK
        BIGINT user_key FK
        ENUM role "LEADER|MANAGER|MEMBER"
        ENUM status
        DATETIME joined_at
        DATETIME left_at
    }

    group_create_request {
        BIGINT request_id PK
        BIGINT user_key FK
        VARCHAR group_name
        TEXT description
        DATETIME requested_at
        ENUM status
        TEXT reject_reason
        BIGINT updated_by_user_key FK
        DATETIME status_updated_at
    }

    group_join_request {
        BIGINT request_id PK
        BIGINT group_id FK
        BIGINT user_key FK
        ENUM status
        DATETIME requested_at
        DATETIME approved_at
        TEXT reject_reason
    }

    notification {
        BIGINT notification_id PK
        BIGINT user_key FK
        ENUM source_table
        BIGINT source_id
        ENUM category
        VARCHAR title
        TEXT content
        TINYINT is_read
        DATETIME created_at
    }

    `user` ||--o{ group_member : member_of
    `group` ||--o{ group_member : has_members

    `user` ||--o{ group_create_request : requested_by
    group_create_request }o--|| `group` : may_create

    `group` ||--o{ group_join_request : has_join_requests
    `user` ||--o{ group_join_request : join_requests

    `user` ||--o{ notification : receives

    `user` ||--o{ `group` : leads
    `group` }o--|| group_create_request : created_from
```

---

## 참고 사항
- 테이블 명이 MySQL 예약어(`user`, `group`)와 충돌하므로 쿼리 작성 시 백틱(``) 사용이 필요합니다.
- `notification`, `group_join_ban`, `group_member_permission` 등 최근 추가된 테이블은 관련 서비스 레이어 구현 진행 상황에 따라 컬럼이 변경될 수 있습니다. 변경 시 이 문서도 함께 갱신합니다.