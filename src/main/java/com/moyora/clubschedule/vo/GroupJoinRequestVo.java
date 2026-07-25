package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupJoinRequestVo {
    private Long requestId;
    private Long groupId;
    private Long userKey;
    private String nickname;
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private String rejectReason;
}
