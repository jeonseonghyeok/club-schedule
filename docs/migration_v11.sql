-- migration_v11 (2026-10-29): 모임 전용 앱(모임별 PWA)
-- 기존 행은 꺼진 상태(0)로 시작한다. 배포 전에 적용해도 기존 코드에 영향이 없다.
ALTER TABLE `group`
    ADD COLUMN app_enabled     TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '모임 전용 앱 제공 여부(시스템 관리자가 지정) — migration_v11',
    ADD COLUMN app_name        VARCHAR(30) NULL COMMENT '전용 앱 이름(NULL 이면 모임 이름) — migration_v11',
    ADD COLUMN app_theme_color CHAR(7)     NULL COMMENT '전용 앱 대표 색(#RRGGBB) — migration_v11';

-- 전용 앱 아이콘(512px PNG). 아이콘은 화면(브라우저)이 모임 이름 첫 글자 + 대표 색으로 그려 올린다.
-- 모임 조회(SELECT *)에 큰 값이 딸려 오지 않도록 별도 테이블에 둔다.
CREATE TABLE group_app_icon (
    group_id   BIGINT(20) UNSIGNED NOT NULL COMMENT '모임 키',
    png        MEDIUMBLOB NOT NULL COMMENT '512x512 PNG',
    updated_at DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (group_id),
    CONSTRAINT fk_app_icon_group FOREIGN KEY (group_id) REFERENCES `group` (group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='모임 전용 앱 아이콘 — migration_v11';
