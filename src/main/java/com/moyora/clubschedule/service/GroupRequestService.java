package com.moyora.clubschedule.service;

import com.moyora.clubschedule.mapper.GroupRequestMapper;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.vo.GroupRequest;
import com.moyora.clubschedule.vo.GroupRequestDto;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class GroupRequestService {

    private final GroupRequestMapper groupRequestMapper;

    /**
     * 그룹 신청 요청을 처리
     * @param dto 모임 이름 및 설명
     * @param userKey 요청자(회원 번호)
     */
    public Long requestGroup(GroupRequestDto dto, Long userKey) {
    	if(!isRequestAvailable(userKey))
    		return null;
        // DTO와 userKey를 사용해 엔티티 객체 생성
        GroupRequest groupRequest = GroupRequest.builder()
                .groupName(dto.getGroupName())
                .description(dto.getDescription())
                .userKey(userKey) // 인증된 사용자의 userKey를 저장
                .build();
        
        // 매퍼를 호출하여 DB에 저장
        groupRequestMapper.insertGroupRequest(groupRequest);
        // 저장된 그룹 요청의 고유 ID(PK)를 반환
        return groupRequest.getRequestId();
    }
    
    /**
     * 승인 처리
     */
    @Transactional
    public void approveRequest(Long requestId, Long userKey) {
        groupRequestMapper.updateStatusToAccepted(requestId, userKey);
    }
   
    
    /**
     * 관리자에 의한 그룹 신청 거부 및 거부 사유 기록.
     * @param requestId 거부할 그룹 신청 ID
     * @param rejectReason 거부 사유
     * @return 성공 시 true, 실패 시 false
     */
    public boolean rejectGroupRequest(Long requestId, String rejectReason, Long userKey) {
        // 매퍼 호출로 상태를 'REJECTED'로, 거부 사유 기록
        int updatedRows = groupRequestMapper.updateStatusToRejected(requestId, rejectReason, userKey);
        
        return updatedRows > 0;
    }
    
    
    /**
     * 사용자의 그룹 신청 취소.
     * @param requestId 취소할 그룹 신청 ID
     * @param userKey 요청자(회원 번호)
     * @return 성공 시 true, 실패 시 false
     */
    public boolean cancelGroupRequest(Long requestId, Long userKey) {
        // 매퍼 호출로 상태를 'CANCELLED'로 업데이트
        int updatedRows = groupRequestMapper.updateStatusToCancelled(requestId, userKey);
        
        return updatedRows > 0;
    }
    
    /**
     * 신청 가능 여부 확인
     */
    public boolean isRequestAvailable(Long userKey) {
        int pendingCount = groupRequestMapper.countPendingByUserKey(userKey);
        return pendingCount < 2 ;
    }

    /**
     * 내 신청 확인
     */
    public List<GroupRequest> getMyRequest(Long userKey) {
        return groupRequestMapper.selectByUserKey(userKey);
    }

    // ========== 관리자 기능 ==========

    /**
     * 승인 대기 목록
     */
    public List<GroupRequest> getPendingRequests() {
        return groupRequestMapper.select();
    }

}
