package com.moyora.clubschedule.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.mapper.GroupJoinBanMapper;
import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.vo.GroupJoinBanVo;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupManageService {

    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final GroupJoinBanMapper groupJoinBanMapper;

    /**
     * 그룹 기본 정보 업데이트 (리더/부방장 권한 필요)
     */
    public boolean updateGroupBasicInfo(Long groupId, GroupVo toUpdate) {
        GroupVo current = groupMapper.findById(groupId);
        if (current == null) return false;
        // toUpdate에 groupId 설정 보장
        toUpdate.setGroupId(groupId);
        int updated = groupMapper.update(toUpdate);
        return updated > 0;
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
}