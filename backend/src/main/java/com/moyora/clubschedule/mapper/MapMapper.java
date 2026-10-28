package com.moyora.clubschedule.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 지도 조회 전용 — 좌표가 있는 모임·일정만 */
@Mapper
public interface MapMapper {

    /** 활동 지역 좌표가 있는 모든 모임 + 조회자의 회원 여부 */
    List<Map<String, Object>> selectGroupsWithLocation(@Param("userKey") Long userKey);

    /** 조회자가 활동 회원인 모임의 확정 일정 중 장소 좌표가 있고 기간 안에 시작하는 것 */
    List<Map<String, Object>> selectMySchedulesWithLocation(
            @Param("userKey") Long userKey,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
