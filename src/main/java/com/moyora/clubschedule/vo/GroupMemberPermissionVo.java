package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupMemberPermissionVo {

    private Long groupId;
    private Long userKey;
    private PermissionType permissionType;
    private boolean isAllowed;
    private Long grantedBy;
    private LocalDateTime grantedAt;
    private LocalDateTime updatedAt;

    public enum PermissionType {
        CREATE_SCHEDULE_DIRECT,
        MANAGE_SCHEDULE,
        MANAGE_MEMBER,
        MANAGE_NICKNAME,
        MANAGE_NOTICE
    }
}
