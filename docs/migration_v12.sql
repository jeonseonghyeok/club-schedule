-- migration_v12 (2026-10-30): 모임 전용 앱 홈 화면용 짧은 이름
-- 홈 화면 아이콘 아래에는 12자 안팎만 보이므로 따로 둔다. NULL 이면 앱 이름(또는 모임 이름)을 쓴다.
ALTER TABLE `group`
    ADD COLUMN app_short_name VARCHAR(12) NULL COMMENT '전용 앱 홈 화면 이름(아이콘 아래) — migration_v12' AFTER app_name;
