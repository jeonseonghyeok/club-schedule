package com.moyora.clubschedule.service;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupMemberPermissionMapper;
import com.moyora.clubschedule.mapper.GroupSchedulePolicyMapper;
import com.moyora.clubschedule.vo.GroupMemberPermissionVo.PermissionType;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;
import com.moyora.clubschedule.vo.GroupScheduleVo;
import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;
import com.moyora.clubschedule.vo.GroupVo;

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
    private final GroupMapper                 groupMapper;

    // ── 매니저 권한 프리셋 (docs/ROADMAP.md 2026-07-10 정책 확정: 개별 체크박스 대신 프리셋 단위 부여) ──

    public enum PermissionPreset {
        SCHEDULE_MANAGER(PermissionType.CREATE_SCHEDULE_DIRECT, PermissionType.MANAGE_SCHEDULE),
        ATTENDANCE_MANAGER(PermissionType.MANAGE_SCHEDULE);

        private final Set<PermissionType> grantedTypes;

        PermissionPreset(PermissionType... types) {
            this.grantedTypes = EnumSet.copyOf(Arrays.asList(types));
        }
    }

    /** 프리셋이 관리하는 permission_type 전체(프리셋에 속하지 않은 MANAGE_MEMBER 등은 건드리지 않는다) */
    private static final Set<PermissionType> PRESET_MANAGED_TYPES =
            EnumSet.of(PermissionType.CREATE_SCHEDULE_DIRECT, PermissionType.MANAGE_SCHEDULE);

    /**
     * 매니저 개인에게 프리셋 역할 단위로 권한을 부여/회수한다(전체 교체 방식 — presets에 없는
     * 프리셋의 permission_type은 회수된다). 호출자는 반드시 현재 리더여야 하고, 대상은 반드시
     * role=MANAGER여야 한다(정책: 권한 프리셋은 매니저 전용).
     */
    @Transactional
    public boolean applyPermissionPresets(Long groupId, Long targetUserKey,
                                           Set<PermissionPreset> presets, Long operatorUserKey) {
        if (operatorUserKey == null || targetUserKey == null) return false;

        GroupVo group = groupMapper.findById(groupId);
        if (group == null || !operatorUserKey.equals(group.getLeaderUserKey())) return false;

        String roleStr = groupMemberMapper.selectRoleByGroupAndUser(groupId, targetUserKey);
        if (!"MANAGER".equalsIgnoreCase(roleStr)) return false;

        Set<PermissionType> targetTypes = EnumSet.noneOf(PermissionType.class);
        if (presets != null) {
            for (PermissionPreset preset : presets) targetTypes.addAll(preset.grantedTypes);
        }

        for (PermissionType type : PRESET_MANAGED_TYPES) {
            if (targetTypes.contains(type)) {
                groupMemberPermissionMapper.upsertPermission(groupId, targetUserKey, type.name(), operatorUserKey);
            } else {
                groupMemberPermissionMapper.deletePermission(groupId, targetUserKey, type.name());
            }
        }
        return true;
    }

    /** 현재 활성화된 프리셋 목록(UI 렌더링용) — 프리셋이 요구하는 permission_type을 모두 보유해야 활성으로 본다. */
    public Set<PermissionPreset> resolveActivePresets(Long groupId, Long userKey) {
        List<String> allowed = groupMemberPermissionMapper.selectAllowedTypes(groupId, userKey);
        Set<PermissionType> allowedTypes = new HashSet<>();
        for (String s : allowed) {
            try { allowedTypes.add(PermissionType.valueOf(s)); } catch (IllegalArgumentException ignored) { /* 무시 */ }
        }
        Set<PermissionPreset> result = EnumSet.noneOf(PermissionPreset.class);
        for (PermissionPreset preset : PermissionPreset.values()) {
            if (allowedTypes.containsAll(preset.grantedTypes)) result.add(preset);
        }
        return result;
    }

    /**
     * 일정/출석 관리 가능 여부(boolean, 예외 없음). LEADER는 항상 true, MANAGER는 override 또는
     * 그룹 정책 기본값을 따른다. ScheduleAttendanceService의 출석 승인/거부/체크인 권한 판단에도
     * 재사용해 "출석관리자" 프리셋(MANAGE_SCHEDULE)이 실질적 효과를 갖도록 한다.
     */
    public boolean canManageSchedule(Long groupId, Long userKey) {
        GroupRole role = resolveRole(groupId, userKey);
        if (role == GroupRole.LEADER) return true;
        if (role == GroupRole.MANAGER) return resolveManagerCanManage(groupId, userKey, fetchPolicy(groupId));
        return false;
    }

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
     *  LEADER                                                  → 허용
     *  MANAGER + MANAGE_SCHEDULE 권한(개인 override 또는 정책 기본값) → 허용
     *  그 외                                                    → AccessDenied
     */
    public void validateApprovePermission(Long groupId, Long userKey) {
        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) return;

        if (role == GroupRole.MANAGER) {
            if (resolveManagerCanManage(groupId, userKey, fetchPolicy(groupId))) return;
            throw new GroupAccessDeniedException(
                    "일정 승인/반려 권한이 없습니다. MANAGE_SCHEDULE 권한이 필요합니다.");
        }

        throw new GroupAccessDeniedException("일정 승인/반려 권한이 없습니다. 리더 또는 권한 있는 매니저만 가능합니다.");
    }

    /**
     * 일정 수정 권한 검증.
     *  작성자 본인                        → PENDING·CONFIRMED 모두 수정 가능
     *  LEADER                             → PENDING·CONFIRMED 수정 가능
     *  MANAGER + MANAGE_SCHEDULE 권한     → PENDING·CONFIRMED 수정 가능
     *  REJECTED·CANCELLED                 → 누구도 수정 불가
     *
     * (기존에는 PENDING 상태를 작성자 전용으로 제한해, 오탈자 하나에도 반려 후 재작성을
     *  강제했었다 — MANAGE_SCHEDULE 권한이 있는 매니저/리더는 CONFIRMED와 동일하게
     *  PENDING도 바로 수정할 수 있도록 완화한다.)
     */
    public void validateEditPermission(Long groupId, Long userKey, GroupScheduleVo schedule) {
        ScheduleStatus status = schedule.getStatus();
        if (status == ScheduleStatus.REJECTED || status == ScheduleStatus.CANCELLED) {
            throw new GroupAccessDeniedException("반려되었거나 취소된 일정은 수정할 수 없습니다.");
        }

        if (schedule.getCreatedBy().equals(userKey)) return;

        GroupRole role = resolveRole(groupId, userKey);
        if (role == GroupRole.LEADER) return;
        if (role == GroupRole.MANAGER) {
            GroupSchedulePolicyVo policy = fetchPolicy(groupId);
            if (resolveManagerCanManage(groupId, userKey, policy)) return;
        }

        throw new GroupAccessDeniedException("일정 수정 권한이 없습니다.");
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

        if (role == GroupRole.MANAGER && resolveManagerCanManage(groupId, userKey, fetchPolicy(groupId))) {
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

    /**
     * 그룹의 일정 공개 범위(visibility_type) 조회. 비회원에게 일정을 얼마나 노출할지 판단하는 데 사용한다.
     */
    public GroupSchedulePolicyVo.VisibilityType resolveVisibilityType(Long groupId) {
        return fetchPolicy(groupId).getVisibilityType();
    }
}
