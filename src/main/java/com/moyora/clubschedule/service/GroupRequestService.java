package com.moyora.clubschedule.service;

import com.moyora.clubschedule.mapper.GroupRequestMapper;
import com.moyora.clubschedule.vo.GroupRequestDto;
import com.moyora.clubschedule.vo.GroupRequestVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupRequestService {

    private final GroupRequestMapper groupRequestMapper;

    /**
     * 그룹 신청
     */
    @Transactional
    public void requestGroup(GroupRequestDto dto) {

        groupRequestMapper.insertGroupRequest(dto);
    }
//
//    /**
//     * 신청 취소
//     */
//    @Transactional
//    public void cancelRequest(Long userKey) {
//        groupRequestMapper.deleteRequestByUserKey(userKey);
//    }
//
//    /**
//     * 신청 가능 여부 확인
//     */
//    public boolean isRequestAvailable(Long userKey) {
//        int pendingCount = groupRequestMapper.countPendingByUserKey(userKey);
//        int approvedCount = groupRequestMapper.countApprovedGroupManagedByUser(userKey);
//        return pendingCount < 1 && approvedCount < 1;
//    }
//
//    /**
//     * 내 신청 확인
//     */
//    public GroupRequestVo getMyRequest(Long userKey) {
//        return groupRequestMapper.selectByUserKey(userKey);
//    }
//
//    // ========== 관리자 기능 ==========
//
//    /**
//     * 승인 대기 목록
//     */
//    public List<GroupRequestVo> getPendingRequests() {
//        return groupRequestMapper.selectPendingRequests();
//    }
//
//    /**
//     * 승인 처리
//     */
//    @Transactional
//    public void approveRequest(Long requestId) {
//        groupRequestMapper.updateStatus(
//            requestId,
//            "APPROVED",
//            null,
//            LocalDateTime.now()
//        );
//    }
//
//    /**
//     * 거절 처리
//     */
//    @Transactional
//    public void rejectRequest(Long requestId, String reason) {
//        groupRequestMapper.updateStatus(
//            requestId,
//            "REJECTED",
//            reason,
//            null
//        );
//    }
}
