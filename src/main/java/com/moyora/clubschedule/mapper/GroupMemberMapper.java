package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupMemberVo;

@Mapper
public interface GroupMemberMapper {
    int insertGroupMember(GroupMemberVo vo);
    int countActiveMembers(@Param("groupId") Long groupId);
    int getGroupCapacity(@Param("groupId") Long groupId);
    int countByGroupAndUser(@Param("groupId") Long groupId, @Param("userKey") Long userKey);
}