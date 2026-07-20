package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupJoinBanVo {
    private Long groupId;
    private Long userKey;
    private LocalDateTime bannedAt;
    private Long bannedByUserKey;
    private String reason;
    private Boolean active;
    private LocalDateTime unbannedAt;
    private Long unbannedByUserKey;
}
