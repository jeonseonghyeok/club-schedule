package com.moyora.clubschedule.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupRequestVo {

    private Long requestId;         // 요청 키 (PK)
    private Long userKey;           // 요청자 (user 테이블 참조)
    private String groupName;       // 모임 이름
    private String description;     // 모임 설명
    private LocalDateTime requestedAt;  // 신청일시
    private LocalDateTime approvedAt;   // 승인일시
    private String status;          // 신청 상태 ('PENDING', 'APPROVED', 'REJECTED')
    private String rejectReason;    // 거절 사유
}
