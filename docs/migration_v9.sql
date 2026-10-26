-- migration_v9 (2026-10-27): 일정 반려·취소 사유, 모임별 닉네임
-- 둘 다 NULL 허용 컬럼 추가라 배포 전에 적용해도 기존 코드에 영향이 없다.

-- 일정을 반려(REJECTED)·취소(CANCELLED)할 때 입력한 사유. 그 밖의 상태에서는 NULL.
ALTER TABLE group_schedule
    ADD COLUMN status_reason VARCHAR(500) NULL COMMENT '반려·취소 사유 — migration_v9' AFTER status;

-- 모임 안에서만 쓰는 별명. NULL 이면 user.nickname 을 쓴다.
-- 본인 수정 허용 여부는 기존 group.allow_self_nickname 을 따른다.
ALTER TABLE group_member
    ADD COLUMN nickname VARCHAR(30) NULL COMMENT '모임별 닉네임(NULL 이면 user.nickname) — migration_v9' AFTER role;
