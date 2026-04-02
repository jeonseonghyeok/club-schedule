package com.moyora.clubschedule.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupRequestMapper;
import com.moyora.clubschedule.vo.GroupRequest;
import com.moyora.clubschedule.vo.GroupVo;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.Notification;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class GroupRequestServiceTest {

    @Mock
    private GroupRequestMapper groupRequestMapper;
    @Mock
    private NotificationService notificationService;
    @Mock
    private GroupMapper groupMapper;
    @Mock
    private GroupMemberMapper groupMemberMapper;

    @InjectMocks
    private GroupRequestService service;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void approveRequest_success() {
        GroupRequest req = GroupRequest.builder().requestId(1L).userKey(10L).groupName("Test").description("Desc").build();
        when(groupRequestMapper.selectByRequestId(1L)).thenReturn(req);
        when(groupRequestMapper.updateStatusToProcessing(1L, 99L)).thenReturn(1);

        // simulate insert sets groupId on GroupVo via mapper (MyBatis does this), so stub to set id
        doAnswer(invocation -> {
            GroupVo g = invocation.getArgument(0);
            g.setGroupId(100L);
            return null;
        }).when(groupMapper).insert(any(GroupVo.class));

        when(groupMemberMapper.insertGroupMember(any(GroupMemberVo.class))).thenReturn(1);

        service.approveRequest(1L, 99L);

        verify(groupMapper).insert(any(GroupVo.class));
        verify(groupMemberMapper).insertGroupMember(any(GroupMemberVo.class));
        verify(groupRequestMapper).updateStatusToAccepted(1L, 99L);
        verify(notificationService).createNotification(any(Notification.class));
    }

    @Test
    void approveRequest_alreadyProcessing_throws() {
        GroupRequest req = GroupRequest.builder().requestId(2L).userKey(20L).groupName("T").description("D").build();
        when(groupRequestMapper.selectByRequestId(2L)).thenReturn(req);
        when(groupRequestMapper.updateStatusToProcessing(2L, 99L)).thenReturn(0);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.approveRequest(2L, 99L));
        assertTrue(ex.getMessage().contains("이미 처리"));
    }
}
