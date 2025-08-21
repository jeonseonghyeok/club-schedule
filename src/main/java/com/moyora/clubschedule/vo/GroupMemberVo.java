package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import java.util.Date;
import lombok.Data;

@Data
public class GroupMemberVo {
    private Long groupId;
    private Long userKey;
    private String role;   // 'LEADER', 'MEMBER'
    private String status; // 'ACTIVE', 'WITHDRAWN', 'KICKED'
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
}