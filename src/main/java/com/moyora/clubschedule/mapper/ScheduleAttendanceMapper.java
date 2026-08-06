package com.moyora.clubschedule.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.ScheduleAttendanceVo;

@Mapper
public interface ScheduleAttendanceMapper {

    int countConfirmedAttendees(@Param("scheduleId") Long scheduleId);

    /** 여러 scheduleId에 대한 CONFIRMED 참가자 수를 한 번에 조회 (IN 절 + GROUP BY).
     *  결과 행은 {"scheduleId": Long, "cnt": Long} 형태 — 참가자가 없는 scheduleId는 행 자체가 없다. */
    List<Map<String, Object>> countConfirmedByScheduleIds(@Param("scheduleIds") List<Long> scheduleIds);

    /** is_latest=1 인 현재 유효 행 조회 */
    ScheduleAttendanceVo selectLatest(
            @Param("scheduleId") Long scheduleId,
            @Param("userKey")    Long userKey);

    /** 여러 scheduleId에 대한 특정 사용자의 최신 참가 상태를 한 번에 조회 (IN 절) */
    List<ScheduleAttendanceVo> selectMyLatestByScheduleIds(
            @Param("scheduleIds") List<Long> scheduleIds,
            @Param("userKey")     Long userKey);

    /** 참가자 목록 (is_latest=1, displayName JOIN) */
    List<ScheduleAttendanceVo> selectActiveList(@Param("scheduleId") Long scheduleId);

    /** 여러 scheduleId의 참가자 명단(CONFIRMED/PENDING, is_latest=1)을 한 번에 조회.
     *  group_schedule과 JOIN해 groupId로 스코프를 제한한다(다른 그룹 일정 열람 방지). */
    List<ScheduleAttendanceVo> selectActiveListByScheduleIds(
            @Param("groupId")     Long groupId,
            @Param("scheduleIds") List<Long> scheduleIds);

    /** 기존 is_latest=1 행을 0으로 무효화 */
    int invalidateLatest(
            @Param("scheduleId") Long scheduleId,
            @Param("userKey")    Long userKey);

    /** 새 참가 행 INSERT — 신청/승인/거부/취소/강제취소 전부 이 메서드로 새 행을 만든다.
     *  status 값 자체가 이력 조회 시 어떤 액션이었는지를 의미한다. */
    int insertAttendance(ScheduleAttendanceVo vo);

    /** 참석 체크 (actual_status UPDATE) */
    int updateActualStatus(
            @Param("attendanceId")  Long attendanceId,
            @Param("actualStatus")  ScheduleAttendanceVo.ActualStatus actualStatus,
            @Param("updatedBy")     Long updatedBy);

    /** attendanceId로 단건 조회 */
    ScheduleAttendanceVo selectById(@Param("attendanceId") Long attendanceId);

    /** is_latest 무관 전체 이력(신청/승인/거부/취소) 시간순 조회 */
    List<ScheduleAttendanceVo> selectHistoryByScheduleId(@Param("scheduleId") Long scheduleId);

    /** 본인의 그룹 내 참가 이력(is_latest=1, 일정별 최신 상태) — 일정 제목/시작일시 포함, 최신 일정순 */
    List<ScheduleAttendanceVo> selectMyHistoryByGroup(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey);
}
