package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupScheduleVo;

@Mapper
public interface GroupScheduleMapper {
    List<GroupScheduleVo> selectByGroupId(@Param("groupId") Long groupId);
    int countByGroupId(@Param("groupId") Long groupId);
}
