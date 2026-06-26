package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.moyora.clubschedule.vo.GroupScheduleHistoryVo;

@Mapper
public interface GroupScheduleHistoryMapper {
    int insertHistory(GroupScheduleHistoryVo vo);
}
