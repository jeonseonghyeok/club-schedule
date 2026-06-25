package com.moyora.clubschedule.service;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupMemberPermissionMapper;
import com.moyora.clubschedule.mapper.GroupSchedulePolicyMapper;
import com.moyora.clubschedule.vo.GroupMemberPermissionVo.PermissionType;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo.AllowMemberCreate;
import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;

import lombok.RequiredArgsConstructor;

/**
 * 그룹 내 일정 관련 권한을 일괄 검증하는 컴포넌트.
 *
 * 외부에서는 아래 세 메서드만 호출한다.
 *  - resolveCreatePermission     : 일정 생성 가능 여부 판단 + 초기 status 결정
 *  - validateApprovePermission   : 일정 승인/반려 권한 검증
 *  - validateCancelPermission    : 일정 취소 권한 검증
 */
@Service
@RequiredArgsConstructor
public class GroupPermissionService {

    private final GroupMemberMapper            groupMemberMapper;
    private final GroupMemberPermissionMapper  groupMemberPermissionMapper;
    private final GroupSchedulePolicyMapper    groupSchedulePolicyMapper;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * 일정 생성 권한을 검증하고, 저장해야 할 초기 ScheduleStatus를 반환한다.
     *
     * 규칙 요약:
     *  - LEADER                                       → CONFIRMED (정책 무시)
     *  - MANAGER + CREATE_SCHEDULE_DIRECT 권한 보유   → CONFIRMED
     *  - MANAGER + 해당 권한 없음                     → PENDING  (LEADERS_ONLY여도 생성 허용)
     *  - MEMBER  + policy = ALL                       → PENDING
     *  - MEMBER  + policy = LEADERS_ONLY              → AccessDenied
     */
    public ScheduleStatus resolveCreatePermission(Long groupId, Long userKey) {
        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) {
            return ScheduleStatus.CONFIRMED;
        }

        if (role == GroupRole.MANAGER) {
            if (hasPermission(groupId, userKey, PermissionType.CREATE_SCHEDULE_DIRECT)) {
                return ScheduleStatus.CONFIRMED;
            }
            // CREATE_SCHEDULE_DIRECT 없는 MANAGER: 생성은 허용(LEADERS_ONLY 포함), status는 PENDING
            return ScheduleStatus.PENDING;
        }

        // MEMBER: 그룹 정책 확인
        GroupSchedulePolicyVo policy = fetchPolicy(groupId);
        if (policy.getAllowMemberCreate() == AllowMemberCreate.LEADERS_ONLY) {
            throw new GroupAccessDeniedException(
                    "일정 등록 권한이 없습니다. 이 그룹은 리더 또는 매니저만 일정을 등록할 수 있습니다.");
        }
        return ScheduleStatus.PENDING;
    }

    /**
     * 일정 승인/반려 권한을 검증한다.
     *
     * 규칙 요약:
     *  - LEADER                               → 항상 허용
     *  - MANAGER + MANAGE_SCHEDULE 권한 보유  → 허용
     *  - MANAGER + 해당 권한 없음             → AccessDenied
     *  - MEMBER                               → AccessDenied
     */
    public void validateApprovePermission(Long groupId, Long userKey) {
        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) return;

        if (role == GroupRole.MANAGER) {
            if (hasPermission(groupId, userKey, PermissionType.MANAGE_SCHEDULE)) return;
            throw new GroupAccessDeniedException(
                    "일정 승인/반려 권한이 없습니다. MANAGE_SCHEDULE 권한이 필요합니다.");
        }

        // MEMBER
        throw new GroupAccessDeniedException("일정 승인/반려 권한이 없습니다. 리더 또는 권한 있는 매니저만 가능합니다.");
    }

    /**
     * 일정 취소 권한을 검증한다.
     *
     * 규칙 요약:
     *  - 본인 작성 + PENDING 상태 → 누구든 취소 가능
     *  - 타인 작성 또는 CONFIRMED 상태:
     *      LEADER                              → 허용
     *      MANAGER + MANAGE_SCHEDULE 권한 보유 → 허용
     *      그 외                               → AccessDenied
     *
     * @param scheduleCreatedBy 일정 작성자 userKey
     * @param currentStatus     현재 일정 상태
     */
    public void validateCancelPermission(Long groupId, Long userKey,
                                         Long scheduleCreatedBy, ScheduleStatus currentStatus) {
        // 본인이 작성한 PENDING 일정은 누구나 취소 가능
        if (userKey.equals(scheduleCreatedBy) && currentStatus == ScheduleStatus.PENDING) return;

        GroupRole role = resolveRole(groupId, userKey);

        if (role == GroupRole.LEADER) return;

        if (role == GroupRole.MANAGER
                && hasPermission(groupId, userKey, PermissionType.MANAGE_SCHEDULE)) {
            return;
        }

        throw new GroupAccessDeniedException(
                "일정 취소 권한이 없습니다. 리더 또는 MANAGE_SCHEDULE 권한을 가진 매니저만 가능합니다.");
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** group_member에서 역할을 가져온다. 비멤버면 AccessDenied */
    private GroupRole resolveRole(Long groupId, Long userKey) {
        String roleStr = groupMemberMapper.selectRoleByGroupAndUser(groupId, userKey);
        return GroupRole.from(roleStr); // null이면 내부에서 AccessDenied throw
    }

    /** is_allowed=1 인 권한 레코드가 존재하는지 확인 */
    private boolean hasPermission(Long groupId, Long userKey, PermissionType type) {
        return groupMemberPermissionMapper.countPermission(groupId, userKey, type.name()) > 0;
    }

    /** 정책 조회. 미설정 그룹은 기본 정책(ALL, 승인불필요) 적용 */
    private GroupSchedulePolicyVo fetchPolicy(Long groupId) {
        GroupSchedulePolicyVo policy = groupSchedulePolicyMapper.selectByGroupId(groupId);
        return policy != null ? policy : GroupSchedulePolicyVo.defaultPolicy(groupId);
    }
}
