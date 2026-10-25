package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupJoinRequestVo;

@Mapper
public interface GroupJoinRequestMapper {
    void insert(GroupJoinRequestVo vo);
    List<GroupJoinRequestVo> selectByUserKeyAndGroupId(@Param("userKey") Long userKey, @Param("groupId") Long groupId);
    List<GroupJoinRequestVo> selectPendingByGroupId(@Param("groupId") Long groupId);
    List<GroupJoinRequestVo> selectAllPending();

    // 관리자 전용 — DB 레벨 페이징 + 닉네임/그룹명 검색
    List<GroupJoinRequestVo> selectAllPendingPaged(
            @Param("q") String q, @Param("limit") int limit, @Param("offset") int offset);
    int countAllPendingFiltered(@Param("q") String q);

    int updateStatusToApproved(@Param("requestId") Long requestId, @Param("processedBy") Long processedBy);
    int updateStatusToRejected(@Param("requestId") Long requestId, @Param("processedBy") Long processedBy, @Param("rejectReason") String rejectReason);
    int updateStatusToCancelled(@Param("requestId") Long requestId, @Param("userKey") Long userKey);

    Long selectRequesterUserKey(@Param("requestId") Long requestId);
    GroupJoinRequestVo selectByRequestId(@Param("requestId") Long requestId);

    // 특정 그룹에 대해 동일 사용자의 대기(PENDING) 요청 수 조회
    int countPendingByGroupAndUser(@Param("groupId") Long groupId, @Param("userKey") Long userKey);
}