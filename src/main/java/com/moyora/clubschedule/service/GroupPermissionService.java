package com.moyora.clubschedule.service;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupMemberPermissionMapper;
import com.moyora.clubschedule.mapper.GroupSchedulePolicyMapper;
import com.moyora.clubschedule.vo.GroupMemberPermissionVo.PermissionType;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;
import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 그룹 내 일정 관련 권한을 일괄 검증하는 컴포넌트.
 *
 * 권한 검증 우선순위:
 *  1순위 — group_member_permission 의 개인 override (is_allowed=1/0)
 *  2순위 — group_schedule_policy 의 그룹 기본 정책
 */
@Service
@RequiredArgsConstructor
public class GroupPermissionService {

    private final GroupMemberMapper           groupMemberMapper;
    private final GroupMemberPermissionMapper groupMemberPermissionMapper;
    private final GroupSchedulePolicyMapper   groupSchedulePolicyMapper;

    // ── 화면 렌더링용 권한 요약 ────────────────────────────────────────────────

    @Getter
    @AllArgsConstructor
    public static class SchedulePermissions {
        private final boolean canCreate;           // 일정 등록 버튼 표시 여부
        private final boolean createNeedsApproval; // 등록 시 승인 필요 여부 (PENDING)
        private final boolean canManage;           // 승인·반려·취소 버튼 표시 여부

        public static SchedulePermissions none() {
            return new SchedulePermissions(false, false, false);
        }
    }

    /**
     * 화면 렌더링용 권한 요약. 예외를 던지지 않고 boolean으로 반환한다.
     */
    public SchedulePermissions resolveSchedulePermissions(Long groupId, Long userKey) {
        if (userKey == null) return SchedulePermissions.none();

        String roleStr = groupMemberMapper.selectRoleByGroupAndUser(groupId, userKey);
        if (roleStr == null) return SchedulePermissions.none();

        GroupRole role;
        try { role = GroupRole.valueOf(roleStr.toUpperCase()); }
        catch (IllegalArgumentException e) { return SchedulePermissions.none(); }

        if (role == GroupRole.LEADER) {
            return new SchedulePermissions(true, false, true);
        }

        if (role == GroupRole.MANAGER) {
            boolean createDirect = hasPermission(groupId, userKey, PermissionType.CREATE_SCHEDULE_DIRECT);
            GroupSchedulePolicyVo policy = fetchPolicy(groupId);
            boolean canManage = resolveManagerCanManage(groupId, userKey, policy);
            return new SchedulePermissions(true, !createDirect, canManage);
        }

        // MEMBER
        GroupSchedulePolicyVo policy = fetchPolicy(groupId);
        GroupRole minRole = policy.getMinRoleToCreate() != null ? policy.getMinRoleToCreate() : GroupRole.MEMBER;
        if (minRole == GroupRole.LEADER || minRole == GroupRole.MANAGER) {
            return SchedulePermissions.none();
        }
        return new SchedulePermissions(true, policy.isRequiresApproval(), false);
    }

    // ── 트랜잭션 내 권한 검증 (예외 던짐) ────────────────────────────────────

    /**
     * 일정 생성 권한 검증 후 초기 ScheduleStatus 반환.
     *
     *  LEADER                                      → CONFIRMED
     *  MANAGER + CREATE_SCHEDULE_DIRECT override   → CONFIRMED
     *  MANAGER (override 없음)                     → PENDING (min_role_to_create 무관)
     *  MEMBER  + min_role_to_create = MEMBER       → requires_approval ? PENDING : CONFIRMED
     *  MEMBER  + min_role_to_create = LEADER/MANAGER → AccessDenied
     */
    public ScheduleStatus resolveCreatePermission(Long groupId, Long userKey) {
        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) return ScheduleStatus.CONFIRMED;

        if (role == GroupRole.MANAGER) {
            if (hasPermission(groupId, userKey, PermissionType.CREATE_SCHEDULE_DIRECT)) {
                return ScheduleStatus.CONFIRMED;
            }
            return ScheduleStatus.PENDING;
        }

        // MEMBER
        GroupSchedulePolicyVo policy = fetchPolicy(groupId);
        GroupRole minRole = policy.getMinRoleToCreate() != null ? policy.getMinRoleToCreate() : GroupRole.MEMBER;
        if (minRole == GroupRole.LEADER || minRole == GroupRole.MANAGER) {
            throw new GroupAccessDeniedException(
                    "일정 등록 권한이 없습니다. 이 그룹은 리더 또는 매니저만 일정을 등록할 수 있습니다.");
        }
        return policy.isRequiresApproval() ? ScheduleStatus.PENDING : ScheduleStatus.CONFIRMED;
    }

    /**
     * 일정 승인/반려 권한 검증.
     *  LEADER                             → 허용
     *  MANAGER + MANAGE_SCHEDULE 권한     → 허용
     *  그 외                              → AccessDenied
     */
    public void validateApprovePermission(Long groupId, Long userKey) {
        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) return;

        if (role == GroupRole.MANAGER) {
            if (hasPermission(groupId, userKey, PermissionType.MANAGE_SCHEDULE)) return;
            throw new GroupAccessDeniedException(
                    "일정 승인/반려 권한이 없습니다. MANAGE_SCHEDULE 권한이 필요합니다.");
        }

        throw new GroupAccessDeniedException("일정 승인/반려 권한이 없습니다. 리더 또는 권한 있는 매니저만 가능합니다.");
    }

    /**
     * 일정 취소 권한 검증.
     *  본인 작성 + PENDING → 누구나 가능
     *  그 외: LEADER 또는 MANAGE_SCHEDULE 권한 있는 MANAGER
     */
    public void validateCancelPermission(Long groupId, Long userKey,
                                         Long scheduleCreatedBy, ScheduleStatus currentStatus) {
        if (userKey.equals(scheduleCreatedBy) && currentStatus == ScheduleStatus.PENDING) return;

        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) return;

        if (role == GroupRole.MANAGER && hasPermission(groupId, userKey, PermissionType.MANAGE_SCHEDULE)) {
            return;
        }

        throw new GroupAccessDeniedException(
                "일정 취소 권한이 없습니다. 리더 또는 MANAGE_SCHEDULE 권한을 가진 매니저만 가능합니다.");
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private GroupRole resolveRole(Long groupId, Long userKey) {
        String roleStr = groupMemberMapper.selectRoleByGroupAndUser(groupId, userKey);
        return GroupRole.from(roleStr);
    }

    private boolean hasPermission(Long groupId, Long userKey, PermissionType type) {
        return groupMemberPermissionMapper.countPermission(groupId, userKey, type.name()) > 0;
    }

    /**
     * MANAGER의 일정 관리 권한 판단.
     * 개인 override 행이 있으면 그것을 최우선 적용하고, 없으면 그룹 정책의 기본값 사용.
     */
    private boolean resolveManagerCanManage(Long groupId, Long userKey, GroupSchedulePolicyVo policy) {
        Integer isAllowed = groupMemberPermissionMapper.findIsAllowed(
                groupId, userKey, PermissionType.MANAGE_SCHEDULE.name());
        if (isAllowed != null) return isAllowed == 1;
        return policy.isDefManagerCanManageSchedule();
    }

    private GroupSchedulePolicyVo fetchPolicy(Long groupId) {
        GroupSchedulePolicyVo policy = groupSchedulePolicyMapper.selectByGroupId(groupId);
        return policy != null ? policy : GroupSchedulePolicyVo.defaultPolicy(groupId);
    }
}
