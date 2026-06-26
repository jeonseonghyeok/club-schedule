-- ============================================================
-- migration_v2.sql
-- 처리자(Actor) 컬럼 표준화 및 이력 테이블 생성
-- ============================================================

-- ============================================================
-- 1. 신규 테이블: group_schedule_history
-- ============================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='일정 수정 이력. 수정 전 값을 스냅샷으로 보존';

-- ============================================================
-- 2. schedule_attendance — 컬럼 리네임
-- ============================================================
ALTER TABLE `schedule_attendance`
  CHANGE COLUMN `processed_by` `processed_by_user_key` bigint(20) unsigned DEFAULT NULL
    COMMENT '참가 승인/거부 처리자',
  CHANGE COLUMN `checked_by`   `checked_by_user_key`   bigint(20) unsigned DEFAULT NULL
    COMMENT '출석 체크한 관리자';

-- ============================================================
-- 3. schedule_attendance — updated_by, updated_at 추가
-- ============================================================
ALTER TABLE `schedule_attendance`
  ADD COLUMN `updated_by` bigint(20) unsigned DEFAULT NULL
    COMMENT '상태를 마지막으로 변경한 유저 키'
    AFTER `processed_by_user_key`,
  ADD COLUMN `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
    COMMENT '상태 변경 일시'
    AFTER `updated_by`,
  ADD CONSTRAINT `fk_attendance_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `user` (`user_key`) ON DELETE SET NULL;

-- ============================================================
-- 4. group_create_request — updated_by_user_key → updated_by
-- ============================================================
ALTER TABLE `group_create_request`
  CHANGE COLUMN `updated_by_user_key` `updated_by` bigint(20) unsigned DEFAULT NULL
    COMMENT '마지막 상태 변경자';

-- ============================================================
-- 5. group_member_permission — granted_by → granted_by_user_key
-- ============================================================
ALTER TABLE `group_member_permission`
  CHANGE COLUMN `granted_by` `granted_by_user_key` bigint(20) unsigned DEFAULT NULL
    COMMENT '권한 부여 주체';

-- ============================================================
-- 6. group_schedule — approved_by → approved_by_user_key
-- ============================================================
ALTER TABLE `group_schedule`
  CHANGE COLUMN `approved_by` `approved_by_user_key` bigint(20) unsigned DEFAULT NULL
    COMMENT '승인/반려 처리자 (user_key)';

-- ============================================================
-- 7. group_join_request — updated_by 추가
-- ============================================================
ALTER TABLE `group_join_request`
  ADD COLUMN `updated_by` bigint(20) unsigned DEFAULT NULL
    COMMENT '가입 승인/거부 처리자 (자동 승인 시 NULL)'
    AFTER `reject_reason`,
  ADD CONSTRAINT `fk_joinreq_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `user` (`user_key`) ON DELETE SET NULL;

-- ============================================================
-- 8. group_member — updated_by 추가
-- ============================================================
ALTER TABLE `group_member`
  ADD COLUMN `updated_by` bigint(20) unsigned DEFAULT NULL
    COMMENT '강퇴·역할변경 처리자 (본인 탈퇴 시 본인, 강퇴 시 처리자)'
    AFTER `left_at`,
  ADD CONSTRAINT `fk_member_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `user` (`user_key`) ON DELETE SET NULL;

-- ============================================================
-- 9. group_schedule_policy — updated_by 추가
-- ============================================================
ALTER TABLE `group_schedule_policy`
  ADD COLUMN `updated_by` bigint(20) unsigned DEFAULT NULL
    COMMENT '정책 마지막 변경자'
    AFTER `updated_at`,
  ADD CONSTRAINT `fk_policy_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `user` (`user_key`) ON DELETE SET NULL;
