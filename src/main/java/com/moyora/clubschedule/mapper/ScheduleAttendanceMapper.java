package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.ScheduleAttendanceVo;

@Mapper
public interface ScheduleAttendanceMapper {

    int countConfirmedAttendees(@Param("scheduleId") Long scheduleId);

    /** is_latest=1 인 현재 유효 행 조회 */
    ScheduleAttendanceVo selectLatest(
            @Param("scheduleId") Long scheduleId,
            @Param("userKey")    Long userKey);

    /** 참가자 목록 (is_latest=1, displayName JOIN) */
    List<ScheduleAttendanceVo> selectActiveList(@Param("scheduleId") Long scheduleId);

    /** 기존 is_latest=1 행을 0으로 무효화 */
    int invalidateLatest(
            @Param("scheduleId") Long scheduleId,
            @Param("userKey")    Long userKey);

    /** 새 참가 행 INSERT — 신청/승인/거부/취소/강제취소 전부 이 메서드로 새 행을 만든다.
     *  status 값 자체가 이력 조회 시 어떤 액션이었는지를 의미한다. */
    int insertAttendance(ScheduleAttendanceVo vo);

    /** 출석 체크 (actual_status UPDATE) */
    int updateActualStatus(
            @Param("attendanceId")  Long attendanceId,
            @Param("actualStatus")  ScheduleAttendanceVo.ActualStatus actualStatus,
            @Param("updatedBy")     Long updatedBy);

    /** attendanceId로 단건 조회 */
    ScheduleAttendanceVo selectById(@Param("attendanceId") Long attendanceId);

    /** is_latest 무관 전체 이력(신청/승인/거부/취소) 시간순 조회 */
    List<ScheduleAttendanceVo> selectHistoryByScheduleId(@Param("scheduleId") Long scheduleId);
}
