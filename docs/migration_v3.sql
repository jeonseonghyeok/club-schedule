-- ============================================================
-- migration_v3.sql
-- 출석 체크(actual_status) 정정 이력 테이블 신설
-- ============================================================

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='출석 체크(실제 참석 여부) 정정 이력. 매 체크/재체크마다 변경 전후 값을 기록';

-- schedule_attendance.checked_at이 기존에 UPDATE 문에서 갱신되지 않던 결함 수정용 참고:
-- 코드 수정으로 checked_at을 NOW()로 채우도록 변경했으므로 스키마 자체 변경은 불필요.
