package com.moyora.clubschedule.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.moyora.clubschedule.service.GroupRequestService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class GroupRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GroupRequestService groupRequestService;

    @BeforeEach
    void setup() {

    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveEndpoint_asAdmin_returnsOk() throws Exception {
        doNothing().when(groupRequestService).approveRequest(eq(1L), any());
        mockMvc.perform(post("/group-requests/1/approve").with(csrf())).andExpect(status().isOk());
        verify(groupRequestService).approveRequest(eq(1L), any());
    }

    @Test
    void approveEndpoint_unauthenticated_forbidden() throws Exception {
        // 애플리케이션 보안 설정에 따라 인증 없이는 401을 반환합니다.
        mockMvc.perform(post("/group-requests/1/approve").with(csrf())).andExpect(status().isUnauthorized());
    }
}