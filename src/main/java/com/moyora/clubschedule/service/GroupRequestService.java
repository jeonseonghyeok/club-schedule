package com.moyora.clubschedule.service;

import com.moyora.clubschedule.mapper.GroupRequestMapper;
import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.vo.GroupRequest;
import com.moyora.clubschedule.vo.GroupRequestDto;
import com.moyora.clubschedule.vo.GroupVo;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.Notification;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class GroupRequestService {

    private final GroupRequestMapper groupRequestMapper;
    private final NotificationService notificationService;
    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;

    private static final int DEFAULT_PAGE_SIZE = 10;

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
     * 승인 처리: 그룹 생성, 리더 멤버 추가, 신청 상태 업데이트, 알림 전달
     */
    @Transactional
    public void approveRequest(Long requestId, Long userKey) {
        // 1) 신청 정보 조회
        GroupRequest req = groupRequestMapper.selectByRequestId(requestId);
        if (req == null) throw new RuntimeException("요청을 찾을 수 없습니다.");

        // 1.5) PENDING -> PROCESSING으로 상태 갱신 시도 (동시 승인 방지)
        int processingUpdated = groupRequestMapper.updateStatusToProcessing(requestId, userKey);
        if (processingUpdated <= 0) {
            // 이미 다른 스레드/관리자가 처리했거나 상태가 PENDING이 아님
            throw new RuntimeException("해당 요청은 이미 처리 중이거나 처리되었습니다.");
        }

        // 2) 그룹 테이블에 INSERT
        GroupVo g = new GroupVo();
        g.setName(req.getGroupName());
        g.setLeaderUserKey(req.getUserKey());
        g.setGroupRequestId(requestId);
        groupMapper.insert(g);

        // 3) 그룹 멤버 테이블에 리더로 추가
        GroupMemberVo gm = new GroupMemberVo();
        gm.setGroupId(g.getGroupId());
        gm.setUserKey(req.getUserKey());
        gm.setRole("LEADER");
        gm.setStatus("ACTIVE");
        groupMemberMapper.insertGroupMember(gm);

        // 4) 신청 상태 업데이트 -> APPROVED
        groupRequestMapper.updateStatusToAccepted(requestId, userKey);

        // 5) 알림 생성: 요청자에게 승인 알림
        Long requesterUserKey = req.getUserKey();
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
        // 사용자당 하나의 대기 신청만 허용
        if (pendingCount > 0) return false;
        // 그리고 이미 리더인 경우 신청 불가
        int leaderCount = groupMapperCountByLeaderUserKey(userKey);
        if (leaderCount > 0) return false;
        return true;
    }

    private int groupMapperCountByLeaderUserKey(Long userKey) {
        try {
            return groupMapper == null ? 0 : groupMapper.countByLeaderUserKey(userKey);
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * 내 신청 확인
     */
    public List<GroupRequest> getMyRequest(Long userKey) {
        return groupRequestMapper.selectByUserKey(userKey);
    }

    /**
     * 관리자: 필터(상태, 그룹명) + 페이징 반환
     * @param status optional status filter (null or empty = all)
     * @param groupName optional group name substring
     * @param page 1-based page index
     * @param size page size (default 10)
     * @return Map with keys: "items" -> List<GroupRequest>, "total" -> Integer total count, "page" -> Integer current page, "size" -> Integer page size
     */
    public Map<String,Object> getRequestsByFilters(String status, String groupName, Integer page, Integer size){
        int p = (page == null || page < 1) ? 1 : page;
        int s = (size == null || size < 1) ? DEFAULT_PAGE_SIZE : size;
        int offset = (p - 1) * s;
        Map<String,Object> params = new HashMap<>();
        params.put("status", (status != null && !status.isBlank()) ? status : null);
        params.put("groupName", (groupName != null && !groupName.isBlank()) ? groupName : null);
        params.put("limit", s);
        params.put("offset", offset);
        List<GroupRequest> items = groupRequestMapper.selectByFilters(params);
        int total = groupRequestMapper.countByFilters(params);
        Map<String,Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("page", p);
        result.put("size", s);
        return result;
    }

    /**
     * 관리자: 전체 요청 조회 (상태 무관)
     */
    public List<GroupRequest> getAllRequests() {
        return groupRequestMapper.selectAll();
    }

    /**
     * 관리자: 상태별 요청 조회
     */
    public List<GroupRequest> getRequestsByStatus(String status) {
        if (status == null || status.isBlank()) return getAllRequests();
        return groupRequestMapper.selectByStatus(status);
    }

    // ========== 관리자 기능 ==========

    /**
     * 승인 대기 목록
     */
    public List<GroupRequest> getPendingRequests() {
        return groupRequestMapper.select();
    }

}