package com.moyora.clubschedule.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.dto.GroupScheduleCreateDto;
import com.moyora.clubschedule.dto.GroupScheduleEditDto;
import com.moyora.clubschedule.vo.GroupScheduleVo;

@Mapper
public interface GroupScheduleMapper {
    /** from/to는 null 허용 — null이면 해당 경계 없이 조회(하위호환: 둘 다 null이면 전체 조회) */
    List<GroupScheduleVo> selectByGroupId(
            @Param("groupId") Long groupId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to);
    GroupScheduleVo selectByScheduleId(@Param("scheduleId") Long scheduleId);
    int countByGroupId(@Param("groupId") Long groupId);
    int insertSchedule(GroupScheduleCreateDto dto);

    /** 일정 상태(승인·반려·취소) 및 처리자 업데이트 */
    int updateScheduleStatus(
            @Param("scheduleId") Long scheduleId,
            @Param("status")     GroupScheduleVo.ScheduleStatus status,
            @Param("approvedBy") Long approvedBy);

    /** 일정 내용 수정 */
    int updateSchedule(GroupScheduleEditDto dto);
}
