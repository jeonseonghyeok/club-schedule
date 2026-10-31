-- migration_v13 (2026-10-31): 닉네임 관리 정책·변경 이력
-- 1) 모임 닉네임 관리 기본값을 "모임장이 관리"(회원 본인 수정 불가)로 바꾼다. 기존 모임의 설정은 그대로 둔다.
ALTER TABLE `group`
    MODIFY COLUMN allow_self_nickname TINYINT(1) NOT NULL DEFAULT 0 COMMENT '회원 본인의 모임 닉네임 수정 허용(0=모임장·매니저가 관리) — migration_v13 기본값 0';

-- 2) 모임 닉네임은 가입 때 계정 닉네임을 복사해 모임마다 따로 갖는다.
--    (NULL 이면 계정 닉네임을 따라가므로, 계정 닉네임을 바꾸면 모임장이 관리하는 모임의 이름까지 바뀌어 버린다)
UPDATE group_member gm
JOIN `user` u ON u.user_key = gm.user_key
SET gm.nickname = LEFT(u.nickname, 30)
WHERE gm.nickname IS NULL;

-- 3) 닉네임 변경 이력 — group_id 가 NULL 이면 계정 닉네임
CREATE TABLE nickname_history (
    history_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_key     BIGINT       NOT NULL COMMENT '닉네임이 바뀐 사람',
    group_id     BIGINT       NULL     COMMENT 'NULL=계정 닉네임, 값=그 모임의 닉네임',
    old_nickname VARCHAR(30)  NULL,
    new_nickname VARCHAR(30)  NULL,
    changed_by   BIGINT       NOT NULL COMMENT '바꾼 사람(본인 또는 모임장·매니저)',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_nickname_history_user (user_key, created_at),
    KEY idx_nickname_history_group (group_id, user_key, created_at)
) COMMENT '닉네임 변경 이력 — migration_v13';
