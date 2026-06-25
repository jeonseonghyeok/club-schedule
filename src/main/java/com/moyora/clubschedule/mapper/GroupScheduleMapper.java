package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.dto.GroupScheduleCreateDto;
import com.moyora.clubschedule.vo.GroupScheduleVo;

@Mapper
public interface GroupScheduleMapper {
    List<GroupScheduleVo> selectByGroupId(@Param("groupId") Long groupId);
    GroupScheduleVo selectByScheduleId(@Param("scheduleId") Long scheduleId);
    int countByGroupId(@Param("groupId") Long groupId);
    int insertSchedule(GroupScheduleCreateDto dto);

    /** 일정 상태(승인·반려·취소) 및 처리자 업데이트 */
    int updateScheduleStatus(
            @Param("scheduleId") Long scheduleId,
            @Param("status")     GroupScheduleVo.ScheduleStatus status,
            @Param("approvedBy") Long approvedBy);
}
