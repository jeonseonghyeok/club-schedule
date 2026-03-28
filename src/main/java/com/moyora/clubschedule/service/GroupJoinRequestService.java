package com.moyora.clubschedule.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.exception.AlreadyMemberException;
import com.moyora.clubschedule.exception.DuplicateJoinRequestException;
import com.moyora.clubschedule.mapper.GroupJoinRequestMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.vo.GroupJoinRequestVo;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.Notification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupJoinRequestService {

    private final GroupJoinRequestMapper mapper;
    private final NotificationService notificationService;
    private final GroupMemberMapper groupMemberMapper;
    private final GroupMapper groupMapper;

    public Long requestJoin(Long groupId, Long userKey) {
        // 1) 이미 ACTIVE 멤버인지 확인
        int alreadyMember = groupMemberMapper.countByGroupAndUser(groupId, userKey);
        if (alreadyMember > 0) {
            throw new AlreadyMemberException("이미 해당 그룹의 멤버입니다.");
        }

        // 2) 이미 PENDING 상태의 신청이 있는지 확인
        int pendingCount = mapper.countPendingByGroupAndUser(groupId, userKey);
        if (pendingCount > 0) {
            throw new DuplicateJoinRequestException("이미 해당 그룹에 대한 가입 요청이 대기중입니다.");
        }

        GroupJoinRequestVo vo = GroupJoinRequestVo.builder()
                .groupId(groupId)
                .userKey(userKey)
                .status("PENDING")
                .build();
        mapper.insert(vo);
        return vo.getRequestId();
    }

    public List<GroupJoinRequestVo> getMyRequests(Long userKey) {
        return mapper.selectByUserKey(userKey);
    }

    public List<GroupJoinRequestVo> getPendingByGroup(Long groupId) {
        return mapper.selectPendingByGroupId(groupId);
    }

    public List<GroupJoinRequestVo> getAllPending() {
        return mapper.selectAllPending();
    }

    /**
     * 해당 요청의 그룹에 대해 주어진 userKey가 그룹 리더인지 확인
     */
    public boolean isLeaderForRequest(Long requestId, Long userKey) {
        com.moyora.clubschedule.vo.GroupJoinRequestVo req = mapper.selectByRequestId(requestId);
        if (req == null) return false;
        Long groupId = req.getGroupId();
        if (groupId == null) return false;
        com.moyora.clubschedule.vo.GroupVo group = groupMapper.findById(groupId);
        if (group == null) return false;
        return userKey != null && userKey.equals(group.getLeaderUserKey());
    }

    @Transactional
    public boolean approveJoin(Long requestId, Long operatorUserKey) {
        // 1) 요청자의 userKey 및 groupId 조회
        Long requester = mapper.selectRequesterUserKey(requestId);
        if (requester == null) throw new RuntimeException("요청을 찾을 수 없습니다.");

        com.moyora.clubschedule.vo.GroupJoinRequestVo req = mapper.selectByRequestId(requestId);
        if (req == null) throw new RuntimeException("요청을 찾을 수 없습니다.");
        Long groupId = req.getGroupId();

        // 중복 가입 체크: 이미 ACTIVE 멤버인지 확인
        int alreadyMember = groupMemberMapper.countByGroupAndUser(groupId, requester);
        if (alreadyMember > 0) {
            throw new RuntimeException("이미 해당 그룹의 멤버입니다.");
        }

        // 2) 그룹 용량 체크
        int capacity = groupMemberMapper.getGroupCapacity(groupId);
        int current = groupMemberMapper.countActiveMembers(groupId);
        if (capacity > 0 && current >= capacity) {
            throw new RuntimeException("정원이 가득 찼습니다.");
        }

        // 3) 상태 변경
        int updated = mapper.updateStatusToApproved(requestId, operatorUserKey);
        if (updated <= 0) throw new RuntimeException("요청 상태를 승인으로 변경할 수 없습니다.");

        // 4) group_member에 레코드 추가
        GroupMemberVo gm = new GroupMemberVo();
        gm.setGroupId(groupId);
        gm.setUserKey(requester);
        gm.setRole("MEMBER");
        gm.setStatus("ACTIVE");
        int inserted = groupMemberMapper.insertGroupMember(gm);
        if (inserted <= 0) {
            throw new RuntimeException("그룹 멤버 추가에 실패했습니다.");
        }

        // 5) 알림 생성
        Notification n = Notification.builder()
                .userKey(requester)
                .sourceTable("GROUP_JOIN_REQUEST")
                .sourceId(requestId)
                .category("APPROVE")
                .title("가입 요청이 승인되었습니다")
                .content("모임 가입 요청이 승인되었습니다.")
                .isRead(false)
                .build();
        notificationService.createNotification(n);

        return true;
    }

    public boolean rejectJoin(Long requestId, Long operatorUserKey, String reason) {
        int updated = mapper.updateStatusToRejected(requestId, operatorUserKey, reason);
        if (updated <= 0) {
            throw new RuntimeException("요청을 찾을 수 없거나 상태를 변경할 수 없습니다.");
        }
        Long requester = mapper.selectRequesterUserKey(requestId);
        if (requester != null) {
            Notification n = Notification.builder()
                    .userKey(requester)
                    .sourceTable("GROUP_JOIN_REQUEST")
                    .sourceId(requestId)
                    .category("REJECT")
                    .title("가입 요청이 거부되었습니다")
                    .content(reason != null ? reason : "가입 요청이 거부되었습니다.")
                    .isRead(false)
                    .build();
            notificationService.createNotification(n);
        }
        return true;
    }

    public boolean cancelJoin(Long requestId, Long userKey) {
        int updated = mapper.updateStatusToCancelled(requestId, userKey);
        return updated > 0;
    }
}
