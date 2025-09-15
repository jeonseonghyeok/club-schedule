package com.moyora.clubschedule.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GroupRequest {
    private Long requestId;            // 요청 키 (PK)
    private Long userKey;              // 요청자 (user 테이블 참조)
    private String groupName;          // 모임 이름
    private String description;        // 모임 설명
    private LocalDateTime requestedAt;     // 신청일시
    private GroupRequestStatus status;             // 신청 상태 ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    private String rejectReason;       // 거절 사유
    private Long updatedByUserKey;     // 마지막 상태 변경자
    private LocalDateTime statusUpdatedAt; // 상태 변경일시
}
