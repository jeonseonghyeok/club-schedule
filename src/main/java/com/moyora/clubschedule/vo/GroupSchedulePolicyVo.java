package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupSchedulePolicyVo {

    private Long groupId;
    private GroupRole minRoleToCreate;          // LEADER: 리더만, MANAGER: 매니저 이상, MEMBER: 전체
    private boolean requiresApproval;
    private boolean defManagerCanManageSchedule; // 매니저 기본 일정 관리(승인·반려·취소) 권한
    private boolean requiresAttendanceApproval;
    private VisibilityType visibilityType;
    private LocalDateTime updatedAt;

    public enum VisibilityType { PUBLIC, PARTIAL, PRIVATE }

    /** 정책 미설정 그룹에 적용할 기본값 */
    public static GroupSchedulePolicyVo defaultPolicy(Long groupId) {
        GroupSchedulePolicyVo p = new GroupSchedulePolicyVo();
        p.setGroupId(groupId);
        p.setMinRoleToCreate(GroupRole.MEMBER);
        p.setRequiresApproval(false);
        p.setDefManagerCanManageSchedule(true);
        p.setVisibilityType(VisibilityType.PARTIAL);
        return p;
    }
}
