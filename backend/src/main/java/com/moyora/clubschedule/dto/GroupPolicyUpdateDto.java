package com.moyora.clubschedule.dto;

import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo.VisibilityType;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** PUT /api/groups/{groupId}/policy — group_schedule_policy 전체 교체 */
@Data
public class GroupPolicyUpdateDto {
    @NotNull(message = "일정 등록 가능 범위를 선택하세요.")
    private GroupRole minRoleToCreate;

    @NotNull(message = "일반회원 일정 승인 여부를 선택하세요.")
    private Boolean requiresApproval;

    @NotNull(message = "매니저 기본 일정 관리 권한을 선택하세요.")
    private Boolean defManagerCanManageSchedule;

    @NotNull(message = "참가 신청 승인 여부를 선택하세요.")
    private Boolean requiresAttendanceApproval;

    @NotNull(message = "일정 공개 범위를 선택하세요.")
    private VisibilityType visibilityType;
}
