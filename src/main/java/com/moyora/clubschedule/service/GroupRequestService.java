package com.moyora.clubschedule.service;

import com.moyora.clubschedule.mapper.GroupRequestMapper;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.vo.GroupRequest;
import com.moyora.clubschedule.vo.GroupRequestDto;
import com.moyora.clubschedule.vo.Notification;
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
    private final NotificationService notificationService;

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
        // 알림 생성: 요청자에게 승인 알림
        // 먼저 요청자의 userKey를 가져올 수 있는 매퍼 메서드가 없으므로, 매퍼에 조회 메서드를 추가하는 것이 더 좋습니다.
        // 현재는 간단한 방안으로 groupRequest 테이블의 요청자 ID를 매퍼에서 조회하도록 가정합니다.
        Long requesterUserKey = groupRequestMapper.selectRequesterUserKey(requestId);
        if (requesterUserKey != null) {
            Notification notification = Notification.builder()
                    .userKey(requesterUserKey)
                    .sourceTable("GROUP_CREATE_REQUEST")
                    .sourceId(requestId)
                    .category("APPROVE")
                    .title("그룹 요청이 승인되었습니다")
                    .content("관리자에 의해 그룹 생성 요청이 승인되었습니다.")
                    .isRead(false)
                    .build();
            notificationService.createNotification(notification);
        }
    }
   
    
    /**
     * 관리자에 의한 그룹 신청 거부 및 거부 사유 기록.
     * @param requestId 거부할 그룹 신청 ID
     * @param rejectReason 거부 사유
     * @return 성공 시 true, 실패 시 false
     */
    public boolean rejectGroupRequest(Long requestId, Long userKey, String rejectReason) {
        // 매퍼 호출로 상태를 'REJECTED'로, 거부 사유 기록
        int updatedRows = groupRequestMapper.updateStatusToRejected(requestId, userKey, rejectReason);
        // 알림 생성: 요청자에게 거부 알림
        Long requesterUserKey = groupRequestMapper.selectRequesterUserKey(requestId);
        if (requesterUserKey != null) {
            Notification notification = Notification.builder()
                    .userKey(requesterUserKey)
                    .sourceTable("GROUP_CREATE_REQUEST")
                    .sourceId(requestId)
                    .category("REJECT")
                    .title("그룹 요청이 거부되었습니다")
                    .content(rejectReason != null ? rejectReason : "관리자에 의해 거부되었습니다.")
                    .isRead(false)
                    .build();
            notificationService.createNotification(notification);
        }
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