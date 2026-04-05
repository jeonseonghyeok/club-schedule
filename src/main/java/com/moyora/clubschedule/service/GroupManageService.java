package com.moyora.clubschedule.service;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupManageService {

    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;

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
     * groupId에 대해 userKey가 리더나 부방장인지 확인
     */
    public boolean isLeaderOrSubLeader(Long groupId, Long userKey) {
        if (userKey == null) return false;
        // 리더 확인
        GroupVo g = groupMapper.findById(groupId);
        if (g == null) return false;
        if (userKey.equals(g.getLeaderUserKey())) return true;
        // 부방장은 group_member.role이 'SUB_LEADER'로 가정
        String role = groupMemberMapper.selectRoleByGroupAndUser(groupId, userKey);
        if (role == null) return false;
        return "SUB_LEADER".equalsIgnoreCase(role) || "LEADER".equalsIgnoreCase(role);
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
     * 특정 멤버를 차단(KICKED) 처리 (리더/부방장 권한 필요)
     */
    public boolean banMember(Long groupId, Long targetUserKey, Long operatorUserKey) {
        if (operatorUserKey == null) return false;
        if (!isLeaderOrSubLeader(groupId, operatorUserKey)) return false;
        int updated = groupMemberMapper.updateMemberStatus(groupId, targetUserKey, "KICKED");
        return updated > 0;
    }
}