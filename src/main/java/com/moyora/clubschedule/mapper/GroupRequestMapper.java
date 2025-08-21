package com.moyora.clubschedule.mapper;

import com.moyora.clubschedule.vo.GroupRequestDto;
import com.moyora.clubschedule.vo.GroupRequestVo;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface GroupRequestMapper {

    void insertGroupRequest(GroupRequestDto dto);

//    void deleteRequestByUserKey(@Param("userKey") Long userKey);
//
//    int countPendingByUserKey(@Param("userKey") Long userKey);
//
//    int countApprovedGroupManagedByUser(@Param("userKey") Long userKey);
//
//    GroupRequestVo selectByUserKey(@Param("userKey") Long userKey);
//
//    List<GroupRequestVo> selectPendingRequests();
//
//    void updateStatus(
//        @Param("requestId") Long requestId,
//        @Param("status") String status,
//        @Param("rejectReason") String rejectReason,
//        @Param("approvedAt") LocalDateTime approvedAt
//    );
}
