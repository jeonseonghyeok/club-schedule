package com.moyora.clubschedule.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupJoinRequestService;
import com.moyora.clubschedule.vo.GroupJoinRequestVo;

@RestController
@RequestMapping("/api/groups/{groupId}/join-requests")
public class GroupJoinRequestController {

    @Autowired
    private GroupJoinRequestService service;

    @PostMapping
    public ResponseEntity<?> requestJoin(@PathVariable Long groupId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userDetails.getUserKey();
        Long requestId = service.requestJoin(groupId, userKey);
        return ResponseEntity.ok().body(java.util.Collections.singletonMap("requestId", requestId));
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> cancelJoin(@PathVariable Long groupId, @PathVariable Long requestId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userDetails.getUserKey();
        boolean ok = service.cancelJoin(requestId, userKey);
        if (ok) return ResponseEntity.ok().build();
        return ApiErrors.badRequest("취소할 수 있는 가입 신청이 없습니다.");
    }

    @GetMapping("/me")
    public ResponseEntity<?> myRequests(@PathVariable Long groupId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userDetails.getUserKey();
        List<GroupJoinRequestVo> list = service.getMyRequests(userKey, groupId);
        return ResponseEntity.ok(list);
    }
}