-- ============================================================
-- migration_v4.sql
-- schedule_attendance.applied_at → created_at 컬럼명 변경
--
-- 배경: 코드(ScheduleAttendanceVo.createdAt, ScheduleAttendanceMapper.xml의
-- created_at 참조)는 처음부터 컬럼명을 created_at으로 가정하고 작성되었으나,
-- 실제 운영 DB는 applied_at으로 생성되어 있어 INSERT 시
-- "Unknown column 'created_at' in 'field list'" 오류가 발생했다.
-- 코드 쪽을 applied_at에 맞추는 대신, 컬럼명을 코드 기준(created_at)으로
-- 맞춘다 — group_schedule 등 다른 테이블도 생성 시각 컬럼명을 created_at으로
-- 통일하고 있어 일관성 유지 목적.
-- ============================================================

ALTER TABLE schedule_attendance
  CHANGE COLUMN applied_at created_at datetime NOT NULL DEFAULT current_timestamp()
  COMMENT '신청/변경 시점(= 해당 상태 행이 생성된 시각)';
