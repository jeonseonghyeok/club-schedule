package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import java.util.Date;
import lombok.Data;

@Data
public class GroupMemberVo {
    private Long groupId;
    private Long userKey;
    private String displayName;   // 모임 닉네임이 있으면 그것, 없으면 user.nickname
    private String groupNickname; // group_member.nickname (migration_v9, 없으면 null)
    private String role;   // 'LEADER', 'MANAGER', 'MEMBER'
    private String status; // 'ACTIVE', 'WITHDRAWN', 'KICKED'
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private Boolean banned;   // group_join_ban 존재 여부 (조회 전용, LEFT JOIN 결과)
    private String banReason; // group_join_ban.reason (조회 전용)
}