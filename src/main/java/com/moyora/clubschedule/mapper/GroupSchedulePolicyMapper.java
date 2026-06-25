package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;

@Mapper
public interface GroupSchedulePolicyMapper {

    /** 그룹 일정 운영 정책 조회. 미설정 그룹은 null 반환 */
    GroupSchedulePolicyVo selectByGroupId(@Param("groupId") Long groupId);
}
