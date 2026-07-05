package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.moyora.clubschedule.vo.ScheduleAttendanceCheckHistoryVo;

@Mapper
public interface ScheduleAttendanceCheckHistoryMapper {
    int insertHistory(ScheduleAttendanceCheckHistoryVo vo);
}
