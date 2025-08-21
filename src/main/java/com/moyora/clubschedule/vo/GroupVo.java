package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import java.util.Date;
import lombok.Data;

@Data
public class GroupVo {
    private Long groupId;
    private String name;
    private String description;
    private Long leaderUserKey;
    private Integer capacity;
    private Integer currentMemberCount;
    private Boolean autoApprove;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}