package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupJoinRequestVo;

@Mapper
public interface GroupJoinRequestMapper {
    void insert(GroupJoinRequestVo vo);
    List<GroupJoinRequestVo> selectByUserKey(@Param("userKey") Long userKey);
    List<GroupJoinRequestVo> selectPendingByGroupId(@Param("groupId") Long groupId);
    List<GroupJoinRequestVo> selectAllPending();

    int updateStatusToApproved(@Param("requestId") Long requestId, @Param("processedBy") Long processedBy);
    int updateStatusToRejected(@Param("requestId") Long requestId, @Param("processedBy") Long processedBy, @Param("rejectReason") String rejectReason);
    int updateStatusToCancelled(@Param("requestId") Long requestId, @Param("userKey") Long userKey);

    Long selectRequesterUserKey(@Param("requestId") Long requestId);
    GroupJoinRequestVo selectByRequestId(@Param("requestId") Long requestId);

    // 특정 그룹에 대해 동일 사용자의 대기(PENDING) 요청 수 조회
    int countPendingByGroupAndUser(@Param("groupId") Long groupId, @Param("userKey") Long userKey);
}