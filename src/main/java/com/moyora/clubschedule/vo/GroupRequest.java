package com.moyora.clubschedule.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GroupRequest {
    private Long requestId;
    private Long userKey;
    private String groupName;
    private String description;
    private LocalDateTime requestedAt;
    private GroupRequestStatus status;
    private String rejectReason;
    private Long updatedBy;
    private LocalDateTime statusUpdatedAt;
    private Long groupId;              // 승인 후 생성된 그룹 ID (APPROVED일 때만 존재)
}
