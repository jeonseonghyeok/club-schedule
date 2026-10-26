package com.moyora.clubschedule.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.dto.GroupPolicyUpdateDto;
import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.mapper.GroupJoinBanMapper;
import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupMemberPermissionMapper;
import com.moyora.clubschedule.mapper.GroupSchedulePolicyMapper;
import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.vo.GroupJoinBanVo;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;
import com.moyora.clubschedule.vo.GroupVo;
import com.moyora.clubschedule.vo.UserVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupManageService {

    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final GroupJoinBanMapper groupJoinBanMapper;
    private final GroupSchedulePolicyMapper groupSchedulePolicyMapper;
    private final GroupMemberPermissionMapper groupMemberPermissionMapper;
    private final UserMapper userMapper;
    private final ScheduleAttendanceService scheduleAttendanceService;

    /**
     * 그룹 기본 정보 업데이트 (리더·매니저 권한 필요). 정원은 현재 활동 회원 수보다 작게 줄일 수 없다.
     */
    @Transactional
    public boolean updateGroupBasicInfo(Long groupId, GroupVo toUpdate) {
        GroupVo current = groupMapper.findById(groupId);
        if (current == null) return false;
        if (toUpdate.getCapacity() != null) {
            int activeMembers = groupMemberMapper.countActiveMembers(groupId);
            if (toUpdate.getCapacity() < activeMembers) {
                throw new IllegalArgumentException(
                        String.format("현재 회원 수(%d명)보다 정원을 작게 할 수 없습니다.", activeMembers));
            }
        }
        // toUpdate에 groupId 설정 보장
        toUpdate.setGroupId(groupId);
        int updated = groupMapper.update(toUpdate);
        return updated > 0;
    }

    /** 모임 설정 화면용 — 기본 정보 + 실제 권한 판단에 쓰이는 일정 운영 정책 */
    public Map<String, Object> getSettings(Long groupId) {
        GroupVo group = groupMapper.findById(groupId);
        if (group == null) return null;
        GroupSchedulePolicyVo policy = groupSchedulePolicyMapper.selectByGroupId(groupId);
        if (policy == null) policy = GroupSchedulePolicyVo.defaultPolicy(groupId);

        Map<String, Object> policyMap = new HashMap<>();
        policyMap.put("minRoleToCreate", policy.getMinRoleToCreate() != null ? policy.getMinRoleToCreate().name() : GroupRole.MEMBER.name());
        policyMap.put("requiresApproval", policy.isRequiresApproval());
        policyMap.put("defManagerCanManageSchedule", policy.isDefManagerCanManageSchedule());
        policyMap.put("requiresAttendanceApproval", policy.isRequiresAttendanceApproval());
        policyMap.put("visibilityType", policy.getVisibilityType() != null ? policy.getVisibilityType().name() : null);

        Map<String, Object> settings = new HashMap<>();
        settings.put("groupId", group.getGroupId());
        settings.put("name", group.getName());
        settings.put("description", group.getDescription());
        settings.put("capacity", group.getCapacity());
        settings.put("autoApprove", Boolean.TRUE.equals(group.getAutoApprove()));
        settings.put("allowSelfNickname", Boolean.TRUE.equals(group.getAllowSelfNickname()));
        settings.put("activeMemberCount", groupMemberMapper.countActiveMembers(groupId));
        settings.put("policy", policyMap);
        return settings;
    }

    /** 일정 운영 정책 저장 — 리더 전용(컨트롤러 @PreAuthorize) */
    @Transactional
    public boolean updatePolicy(Long groupId, GroupPolicyUpdateDto policy, Long operatorUserKey) {
        if (groupMapper.findById(groupId) == null) return false;
        groupSchedulePolicyMapper.upsertPolicy(groupId, policy, operatorUserKey);
        return true;
    }

    /** groupId의 리더(group.leader_user_key)인지 확인 */
    public boolean isLeader(Long groupId, Long userKey) {
        if (userKey == null) return false;
        GroupVo group = groupMapper.findById(groupId);
        return group != null && userKey.equals(group.getLeaderUserKey());
    }

    /**
     * groupId에 대해 userKey가 LEADER 또는 MANAGER인지 확인
     */
    public boolean isManager(Long groupId, Long userKey) {
        if (userKey == null) return false;
        String roleStr = groupMemberMapper.selectRoleByGroupAndUser(groupId, userKey);
        if (roleStr == null) return false;
        try {
            GroupRole role = GroupRole.valueOf(roleStr.toUpperCase());
            return role == GroupRole.LEADER || role == GroupRole.MANAGER;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * userKey가 해당 그룹의 멤버(ACTIVE)인지 확인
     */
    public boolean isMember(Long groupId, Long userKey) {
        if (userKey == null) return false;
        int cnt = groupMemberMapper.countByGroupAndUser(groupId, userKey);
        return cnt > 0;
    }

    /**
     * 특정 그룹의 모든 멤버 조회
     */
    public java.util.List<com.moyora.clubschedule.vo.GroupMemberVo> listMembers(Long groupId) {
        return groupMemberMapper.selectMembersByGroup(groupId);
    }

    public static final int GROUP_NICKNAME_MAX = 30; // group_member.nickname VARCHAR(30)

    /**
     * 모임 닉네임 변경. 비우면(null·공백) 계정 닉네임으로 돌아간다.
     * 모임이 본인 수정을 막아두면(allow_self_nickname=0) 리더만 바꿀 수 있다.
     * 다른 활동 회원과 같은 표시 이름은 쓸 수 없다(참가 명단에서 구분되지 않으므로).
     */
    @Transactional
    public String updateMyNickname(Long groupId, Long userKey, String nickname) {
        if (!isMember(groupId, userKey)) throw new IllegalStateException("이 모임의 회원이 아닙니다.");
        GroupVo group = groupMapper.findById(groupId);
        if (!Boolean.TRUE.equals(group.getAllowSelfNickname()) && !isLeader(groupId, userKey)) {
            throw new GroupAccessDeniedException("이 모임은 회원이 닉네임을 바꿀 수 없도록 설정되어 있습니다.");
        }
        String normalized = (nickname == null || nickname.isBlank()) ? null : nickname.trim();
        if (normalized != null && normalized.length() > GROUP_NICKNAME_MAX) {
            throw new IllegalArgumentException("닉네임은 " + GROUP_NICKNAME_MAX + "자까지 입력할 수 있습니다.");
        }
        if (normalized != null && groupMemberMapper.countDisplayNameTaken(groupId, userKey, normalized) > 0) {
            throw new IllegalStateException("이 모임에서 이미 쓰는 이름입니다.");
        }
        groupMemberMapper.updateNickname(groupId, userKey, normalized);
        return normalized;
    }

    /**
     * 본인 탈퇴. 리더는 먼저 다른 회원에게 리더를 넘겨야 한다(모임에 리더가 항상 1명 있어야 하므로).
     * 상태를 WITHDRAWN 으로 바꾸고 직책·개인 권한을 지우며, 앞으로의 참가 신청을 취소하고,
     * 이 모임이 우선모임이면 해제한다. 탈퇴는 차단이 아니므로 언제든 다시 가입 신청할 수 있다.
     */
    @Transactional
    public void withdraw(Long groupId, Long userKey) {
        GroupMemberVo me = groupMemberMapper.selectMemberAnyStatus(groupId, userKey);
        if (me == null || !"ACTIVE".equals(me.getStatus())) {
            throw new IllegalStateException("이 모임의 회원이 아닙니다.");
        }
        if (isLeader(groupId, userKey)) {
            throw new IllegalStateException("리더는 다른 회원에게 리더를 넘긴 뒤 탈퇴할 수 있습니다.");
        }
        groupMemberMapper.withdrawMember(groupId, userKey);
        groupMemberPermissionMapper.deleteAllPermissions(groupId, userKey);
        scheduleAttendanceService.cancelUpcomingForLeavingMember(groupId, userKey);
        UserVo user = userMapper.selectByUserKey(userKey);
        if (user != null && groupId.equals(user.getFavoriteGroupId())) {
            userMapper.updateFavoriteGroup(userKey, null);
        }
    }

    /**
     * 멤버를 차단 처리한다(LEADER 또는 MANAGER 권한 필요).
     * 대상은 반드시 role=MEMBER여야 한다 — 모임리더는 절대 내보내기 대상이 될 수 없고,
     * 매니저 역시 서로(혹은 리더가 매니저를) 내보낼 수 없다.
     * ACTIVE 멤버면 status를 KICKED로 바꾸고, WITHDRAWN(자진 탈퇴) 멤버면 status는
     * WITHDRAWN을 유지한 채 group_join_ban에만 기록한다("탈퇴했지만 재가입은 막고 싶은" 시나리오).
     * 어느 경우든 group_join_ban 행을 upsert(active=1)해 재가입 신청을 차단한다.
     */
    @Transactional
    public boolean banMember(Long groupId, Long targetUserKey, Long operatorUserKey, String reason) {
        if (operatorUserKey == null) return false;
        if (!isManager(groupId, operatorUserKey)) return false;

        GroupMemberVo current = groupMemberMapper.selectMemberAnyStatus(groupId, targetUserKey);
        if (current == null) return false;
        if (!"MEMBER".equals(current.getRole())) return false;
        if ("ACTIVE".equals(current.getStatus())) {
            groupMemberMapper.updateMemberStatus(groupId, targetUserKey, "KICKED");
        }

        GroupJoinBanVo ban = new GroupJoinBanVo();
        ban.setGroupId(groupId);
        ban.setUserKey(targetUserKey);
        ban.setBannedByUserKey(operatorUserKey);
        ban.setReason(reason);
        groupJoinBanMapper.upsertBan(ban);
        return true;
    }

    /**
     * 벤 해제 — group_join_ban 행을 삭제하지 않고 active=0으로 비활성화하며 해제자/해제일시를
     * 기록한다(누가 벤을 걸고 누가 해제했는지 이력 보존). group_member.status는 건드리지
     * 않는다 — 내보내기(KICKED) 이력 자체는 상태로 남아 있어야 하며, 벤 해제는 오직 재가입
     * 신청 가능 여부(isBanned)에만 영향을 준다. 실제로 ACTIVE 복귀는 재가입 승인을 통해서만
     * 이뤄진다.
     */
    @Transactional
    public boolean unbanMember(Long groupId, Long targetUserKey, Long operatorUserKey) {
        if (operatorUserKey == null) return false;
        if (!isManager(groupId, operatorUserKey)) return false;
        groupJoinBanMapper.deactivateBan(groupId, targetUserKey, operatorUserKey);
        return true;
    }

    /**
     * groupId에 대해 userKey가 차단된 상태인지 확인 — group_join_ban에 active=1인 기록이
     * 있으면 차단된 것으로 본다(group_member.status는 더 이상 판단 근거로 쓰지 않음).
     */
    public boolean isBanned(Long groupId, Long userKey) {
        if (userKey == null) return false;
        GroupJoinBanVo ban = groupJoinBanMapper.selectByGroupAndUser(groupId, userKey);
        return ban != null && Boolean.TRUE.equals(ban.getActive());
    }

    /**
     * 멤버 역할을 승격/강등한다. 호출자는 반드시 현재 리더(group.leader_user_key 기준)여야 한다.
     *
     * newRole == LEADER: 리더 승계. 같은 트랜잭션 안에서 기존 리더를 MANAGER로 강등하고,
     *   group.leader_user_key와 target의 group_member.role을 함께 갱신한다(그룹당 LEADER는
     *   항상 정확히 1명 — leader_user_key가 유일 진실소스이고 role은 이를 따라간다).
     * newRole == MANAGER/MEMBER: target이 현재 리더가 아닐 때만 허용한다. 리더 본인의 강등은
     *   반드시 다른 멤버를 리더로 승격시키는 승계 경로로만 가능하다.
     */
    @Transactional
    public boolean changeRole(Long groupId, Long targetUserKey, GroupRole newRole, Long operatorUserKey) {
        if (operatorUserKey == null || targetUserKey == null || newRole == null) return false;

        GroupVo group = groupMapper.findById(groupId);
        if (group == null || !operatorUserKey.equals(group.getLeaderUserKey())) return false;

        GroupMemberVo target = groupMemberMapper.selectMemberAnyStatus(groupId, targetUserKey);
        if (target == null || !"ACTIVE".equals(target.getStatus())) return false;

        boolean targetIsCurrentLeader = targetUserKey.equals(group.getLeaderUserKey());

        if (newRole == GroupRole.LEADER) {
            if (targetIsCurrentLeader) return true; // 이미 리더 — 변경 없음
            groupMemberMapper.updateMemberRole(groupId, group.getLeaderUserKey(), GroupRole.MANAGER.name());
            groupMapper.updateLeaderUserKey(groupId, targetUserKey);
            groupMemberMapper.updateMemberRole(groupId, targetUserKey, GroupRole.LEADER.name());
            return true;
        }

        // MANAGER/MEMBER로 변경 — 현재 리더는 승계 경로(위 분기)로만 강등 가능
        if (targetIsCurrentLeader) return false;
        groupMemberMapper.updateMemberRole(groupId, targetUserKey, newRole.name());
        return true;
    }
}