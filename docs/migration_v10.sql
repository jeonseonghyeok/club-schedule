-- migration_v10 (2026-10-28): 모임 대표 활동 지역(지도 조회용)
-- NULL 허용 컬럼 추가라 배포 전에 적용해도 기존 코드에 영향이 없다.
ALTER TABLE `group`
    ADD COLUMN region_name VARCHAR(100)  NULL COMMENT '대표 활동 지역 이름 — migration_v10' AFTER description,
    ADD COLUMN latitude    DECIMAL(10,8) NULL COMMENT '대표 활동 지역 위도 — migration_v10' AFTER region_name,
    ADD COLUMN longitude   DECIMAL(11,8) NULL COMMENT '대표 활동 지역 경도 — migration_v10' AFTER latitude;
