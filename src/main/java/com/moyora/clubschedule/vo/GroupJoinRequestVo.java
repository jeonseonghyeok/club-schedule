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
    private String groupName; // 관리자 전체 조회(그룹 무관)에서만 채워짐
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private String rejectReason;
}
