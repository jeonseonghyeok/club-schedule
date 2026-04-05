package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupVo;

import java.util.List;

@Mapper
public interface GroupMemberMapper {
    int insertGroupMember(GroupMemberVo vo);
    int countActiveMembers(@Param("groupId") Long groupId);
    int getGroupCapacity(@Param("groupId") Long groupId);
    int countByGroupAndUser(@Param("groupId") Long groupId, @Param("userKey") Long userKey);

    // 새로 추가: 사용자가 속한 그룹 목록 조회 (ACTIVE 상태)
    List<GroupVo> selectGroupsByUser(@Param("userKey") Long userKey);

    // 새로 추가: 특정 그룹에서 사용자의 역할 조회 (예: LEADER, SUB_LEADER, MEMBER)
    String selectRoleByGroupAndUser(@Param("groupId") Long groupId, @Param("userKey") Long userKey);

    // 새로 추가: 특정 그룹의 모든 멤버 조회 (상태 포함)
    List<GroupMemberVo> selectMembersByGroup(@Param("groupId") Long groupId);

    // 새로 추가: 특정 멤버의 상태 업데이트 (예: KICKED, WITHDRAWN)
    int updateMemberStatus(@Param("groupId") Long groupId, @Param("userKey") Long userKey, @Param("status") String status);
}