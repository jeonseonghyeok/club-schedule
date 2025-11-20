package com.moyora.clubschedule.mapper;

import com.moyora.clubschedule.vo.GroupRequest;

import java.util.List;

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

    /* 그룹 신청 승인 (상태 변경) */
    int updateStatusToAccepted(@Param("requestId") Long requestId, @Param("userKey") Long userKey);
    
	/* 그룹 신청 취소 (상태 변경) */
    int updateStatusToCancelled(@Param("requestId") Long requestId, @Param("userKey") Long userKey);

    
	/* 그룹 신청 거부 (상태 및 거부 사유 기록) */
    int updateStatusToRejected(@Param("requestId") Long requestId, @Param("userKey") Long userKey, @Param("rejectReason") String rejectReason);
 
}
