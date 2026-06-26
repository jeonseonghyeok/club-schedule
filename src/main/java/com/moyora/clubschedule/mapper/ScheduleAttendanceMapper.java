package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ScheduleAttendanceMapper {
    int countConfirmedAttendees(@Param("scheduleId") Long scheduleId);
}
