package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.NicknameHistoryVo;

@Mapper
public interface NicknameHistoryMapper {
    int insert(NicknameHistoryVo vo);

    // 한 모임에서 한 회원의 닉네임 이력(최신순)
    List<NicknameHistoryVo> selectByGroupMember(@Param("groupId") Long groupId, @Param("userKey") Long userKey);

    // 한 사람의 계정·모든 모임 닉네임 이력(최신순)
    List<NicknameHistoryVo> selectByUser(@Param("userKey") Long userKey);
}
