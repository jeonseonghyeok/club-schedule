package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupJoinRequestVo {
    private Long requestId;
    private Long groupId;
    private Long userKey;
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private String rejectReason;
}
