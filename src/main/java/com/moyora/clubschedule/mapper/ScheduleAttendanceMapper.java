package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.ScheduleAttendanceVo;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo.AttendanceStatus;

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

    /** 새 참가 행 INSERT */
    int insertAttendance(ScheduleAttendanceVo vo);

    /** 상태 업데이트 (approve/reject/cancel/check) */
    int updateStatus(
            @Param("attendanceId") Long attendanceId,
            @Param("status")       AttendanceStatus status,
            @Param("updatedBy")    Long updatedBy);

    /** 출석 체크 (actual_status UPDATE) */
    int updateActualStatus(
            @Param("attendanceId")  Long attendanceId,
            @Param("actualStatus")  ScheduleAttendanceVo.ActualStatus actualStatus,
            @Param("updatedBy")     Long updatedBy);

    /** approve/reject 시 processedByUserKey 기록 */
    int updateProcessed(
            @Param("attendanceId")       Long attendanceId,
            @Param("status")             AttendanceStatus status,
            @Param("processedByUserKey") Long processedByUserKey,
            @Param("updatedBy")          Long updatedBy);

    /** attendanceId로 단건 조회 */
    ScheduleAttendanceVo selectById(@Param("attendanceId") Long attendanceId);
}
