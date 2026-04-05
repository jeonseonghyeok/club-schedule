package com.moyora.clubschedule.mapper;

import com.moyora.clubschedule.vo.GroupRequest;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GroupRequestMapper {

    void insertGroupRequest(GroupRequest dto);

    int countPendingByUserKey(@Param("userKey") Long userKey);

	/* 그룹 신청 전체조회(사용자용) */ 
    List<GroupRequest> selectByUserKey(@Param("userKey") Long userKey);
    
	/* 그룹 신청 전체조회(관리자용) */
    List<GroupRequest> select();

    // 관리자: 전체 조회 (상태 무관)
    List<GroupRequest> selectAll();

    // 관리자: 상태별 조회
    List<GroupRequest> selectByStatus(@Param("status") String status);
    
    // 관리자: 필터(상태, 그룹명) + 페이징
    List<GroupRequest> selectByFilters(Map<String,Object> params);
    
    // 관리자: 필터된 결과 총갯수 (페이징)
    int countByFilters(Map<String,Object> params);
    
    /* 그룹 신청 승인 (상태 변경) */
    int updateStatusToAccepted(@Param("requestId") Long requestId, @Param("userKey") Long userKey);
    
    // 새로 추가: 승인 직전 락(상태를 PROCESSING으로 변경)
    int updateStatusToProcessing(@Param("requestId") Long requestId, @Param("userKey") Long userKey);
    
	/* 그룹 신청 취소 (상태 변경) */
    int updateStatusToCancelled(@Param("requestId") Long requestId, @Param("userKey") Long userKey);

    
	/* 그룹 신청 거부 (상태 및 거부 사유 기록) */
    int updateStatusToRejected(@Param("requestId") Long requestId, @Param("userKey") Long userKey, @Param("rejectReason") String rejectReason);
 
    // 요청자의 user_key 조회
    Long selectRequesterUserKey(@Param("requestId") Long requestId);

    // 새로 추가: requestId로 그룹 요청 조회
    GroupRequest selectByRequestId(@Param("requestId") Long requestId);
 
}