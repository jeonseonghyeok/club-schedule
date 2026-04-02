package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
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

    // 추가 필드: 스케줄 정책 및 부방장 기본 권한
    private String schedulePolicy; // ALL, LEADERS_ONLY, APPROVAL_REQUIRED
    private Boolean defSubCanSchedule;
    private Boolean defSubCanMember;
    private Boolean defSubCanNickname;

    // 그룹 신청과의 연관키
    private Long groupRequestId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}