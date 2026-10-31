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
    private Boolean allowSelfNickname; // 회원 본인이 모임 닉네임을 바꿀 수 있는지

    // 대표 활동 지역(migration_v10) — 지도 조회용, 없으면 null
    private String regionName;
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;

    // 모임 전용 앱(migration_v11) — 시스템 관리자가 켜고, 리더·매니저가 이름·색을 정한다
    private Boolean appEnabled;
    private String appName;
    private String appShortName;
    private String appThemeColor;

    // GET /api/groups/me 에서만 채움: 이 모임에서 내 닉네임(group_member.nickname)
    private String myNickname;
    private String myRole; // 내 모임 목록에서만 — LEADER/MANAGER/MEMBER

    // 추가 필드: 스케줄 정책 및 부방장 기본 권한
    private String schedulePolicy; // ALL, LEADERS_ONLY, APPROVAL_REQUIRED

    // 그룹 신청과의 연관키
    private Long groupRequestId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}