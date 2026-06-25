package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupSchedulePolicyVo {

    private Long groupId;
    private AllowMemberCreate allowMemberCreate;
    private boolean requiresApproval;
    private boolean defSubCanManageSchedule;
    private boolean defSubCanManageMember;
    private boolean defSubCanManageNickname;
    private boolean allowSelfNickname;
    private boolean requiresAttendanceApproval;
    private VisibilityType visibilityType;
    private LocalDateTime updatedAt;

    public enum AllowMemberCreate {
        ALL,
        LEADERS_ONLY
    }

    public enum VisibilityType {
        PUBLIC,
        PARTIAL,
        PRIVATE
    }

    /** 정책 미설정 그룹에 적용할 기본값 */
    public static GroupSchedulePolicyVo defaultPolicy(Long groupId) {
        GroupSchedulePolicyVo p = new GroupSchedulePolicyVo();
        p.setGroupId(groupId);
        p.setAllowMemberCreate(AllowMemberCreate.ALL);
        p.setRequiresApproval(false);
        p.setVisibilityType(VisibilityType.PARTIAL);
        return p;
    }
}
